using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.EntityFrameworkCore;
using OpenBullet2.Core;
using OpenBullet2.Core.Helpers;
using OpenBullet2.Core.Repositories;
using OpenBullet2.Core.Services;
using OpenBullet2.Web;
using OpenBullet2.Web.Controllers;
using OpenBullet2.Web.Exceptions;
using OpenBullet2.Web.Interfaces;
using OpenBullet2.Web.Middleware;
using OpenBullet2.Web.Services;
using OpenBullet2.Web.SignalR;
using OpenBullet2.Web.Utils;
using RuriLib.Helpers;
using RuriLib.Logging;
using RuriLib.Providers.RandomNumbers;
using RuriLib.Providers.UserAgents;
using RuriLib.Services;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

var userDataFolder = builder.Configuration.GetSection("Settings")
    .GetValue<string>("UserDataFolder") ?? "UserData";

// Configuration tweaks
var workerThreads = builder.Configuration.GetSection("Resources").GetValue("WorkerThreads", 1000);
var ioThreads = builder.Configuration.GetSection("Resources").GetValue("IOThreads", 1000);
var connectionLimit = builder.Configuration.GetSection("Resources").GetValue("ConnectionLimit", 1000);

ThreadPool.SetMinThreads(workerThreads, ioThreads);
ServicePointManager.DefaultConnectionLimit = connectionLimit;

builder.Services.Configure<FormOptions>(x =>
{
    x.MultipartBodyLengthLimit = long.MaxValue;
});

// Add services to the container.

builder.Services.AddApiVersioning(options =>
{
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.DefaultApiVersion = new Microsoft.AspNetCore.Mvc.ApiVersion(1, 0);
    options.ReportApiVersions = true;
});

builder.Services.AddControllers()
    .AddJsonOptions(opts => {
        var enumConverter = new JsonStringEnumConverter(JsonNamingPolicy.CamelCase);
        opts.JsonSerializerOptions.Converters.Add(enumConverter);
    });

builder.Services.AddRouting(options => options.LowercaseUrls = true);

builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        var enumConverter = new JsonStringEnumConverter(JsonNamingPolicy.CamelCase);
        options.PayloadSerializerOptions.Converters.Add(enumConverter);
    });

// Swagger with versioning implemented according to this guide
// https://referbruv.com/blog/integrating-aspnet-core-api-versions-with-swagger-ui/
builder.Services.AddVersionedApiExplorer(setup =>
{
    setup.GroupNameFormat = "'v'VVV";
    setup.SubstituteApiVersionInUrl = true;
});
builder.Services.AddSwaggerGen();
builder.Services.ConfigureOptions<ConfigureSwaggerOptions>();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty,
    b => b.MigrationsAssembly("OpenBullet2.Core")));

builder.Services.AddAutoMapper(typeof(AutoMapperProfile).Assembly);

// Scoped
builder.Services.AddScoped<IProxyRepository, DbProxyRepository>();
builder.Services.AddScoped<IProxyGroupRepository, DbProxyGroupRepository>();
builder.Services.AddScoped<IHitRepository, DbHitRepository>();
builder.Services.AddScoped<IJobRepository, DbJobRepository>();
builder.Services.AddScoped<IGuestRepository, DbGuestRepository>();
builder.Services.AddScoped<IRecordRepository, DbRecordRepository>();
builder.Services.AddScoped<IWordlistRepository>(service =>
    new HybridWordlistRepository(service.GetService<ApplicationDbContext>(),
    $"{userDataFolder}/Wordlists"));

builder.Services.AddScoped<DataPoolFactoryService>();
builder.Services.AddScoped<ProxySourceFactoryService>();

// Singleton
builder.Services.AddSingleton(sp => sp); // The service provider itself
builder.Services.AddSingleton<IAuthTokenService, AuthTokenService>();
builder.Services.AddSingleton<IAnnouncementService, AnnouncementService>();
builder.Services.AddSingleton<IUpdateService, UpdateService>();
builder.Services.AddSingleton<PerformanceMonitorService>();
builder.Services.AddSingleton<IConfigRepository>(service =>
    new DiskConfigRepository(service.GetService<RuriLibSettingsService>(),
    $"{userDataFolder}/Configs"));
builder.Services.AddSingleton<ConfigService>();
builder.Services.AddSingleton(service =>
    new ConfigSharingService(service.GetRequiredService<IConfigRepository>(),
        service.GetRequiredService<ILogger<ConfigSharingService>>(),
        userDataFolder));
builder.Services.AddSingleton<ProxyReloadService>();
builder.Services.AddSingleton<JobFactoryService>();
builder.Services.AddSingleton<JobManagerService>();
builder.Services.AddSingleton(service =>
    new JobMonitorService(service.GetService<JobManagerService>(),
        fileName: $"{userDataFolder}/triggeredActions.json", autoSave: false));
builder.Services.AddSingleton<HitStorageService>();
builder.Services.AddSingleton(_ => new RuriLibSettingsService(userDataFolder));
builder.Services.AddSingleton(_ => new OpenBulletSettingsService(userDataFolder));
builder.Services.AddSingleton(_ => new PluginRepository($"{userDataFolder}/Plugins"));
builder.Services.AddSingleton(_ => new ThemeService($"{userDataFolder}/Themes"));
builder.Services.AddSingleton<IRandomUAProvider>(
    _ => new IntoliRandomUAProvider("user-agents.json"));
builder.Services.AddSingleton<IRNGProvider, DefaultRNGProvider>();
builder.Services.AddSingleton<IJobLogger>(service =>
    new FileJobLogger(service.GetService<RuriLibSettingsService>(),
    $"{userDataFolder}/Logs/Jobs"));
builder.Services.AddSingleton<ConfigDebuggerService>();
builder.Services.AddSingleton<ProxyCheckJobService>();
builder.Services.AddSingleton<MultiRunJobService>();

// Hosted Services
builder.Services.AddHostedService(
    b => b.GetRequiredService<IUpdateService>());
builder.Services.AddHostedService(
    b => b.GetRequiredService<PerformanceMonitorService>());

var app = builder.Build();

var versionDescriptionProvider = app.Services.GetRequiredService<IApiVersionDescriptionProvider>();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    foreach (var groupName in versionDescriptionProvider.ApiVersionDescriptions
                 .Select(description => description.GroupName))
    {
        options.SwaggerEndpoint(
            $"/swagger/{groupName}/swagger.json",
            groupName.ToUpperInvariant());
    }
});

app.UseCors(o => o
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials() // Needed for SignalR (it uses sticky cookie-based sessions for reconnection)
    .WithOrigins("http://localhost:4200") // TODO: Make this editable from the config, if not configured get it from the value of --urls
    .WithExposedHeaders("Content-Disposition", "X-Application-Warning")
);

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<AuthTokenVerificationMiddleware>();

app.UseRouting();

app.UseAuthorization();

app.MapControllers();

app.MapHub<ConfigDebuggerHub>("hubs/config-debugger", options =>
{
    // Incoming messages <= 1 MB
    options.ApplicationMaxBufferSize = 1_000_000;

    // Outgoing messages <= 10 MB
    options.TransportMaxBufferSize = 10_000_000;
});

app.MapHub<ProxyCheckJobHub>("hubs/proxy-check-job", options =>
{
    // Incoming messages <= 1 MB
    options.ApplicationMaxBufferSize = 1_000_000;

    // Outgoing messages <= 10 MB
    options.TransportMaxBufferSize = 10_000_000;
});

app.MapHub<MultiRunJobHub>("hubs/multi-run-job", options =>
{
    // Incoming messages <= 1 MB
    options.ApplicationMaxBufferSize = 1_000_000;

    // Outgoing messages <= 10 MB
    options.TransportMaxBufferSize = 10_000_000;
});

app.MapHub<SystemPerformanceHub>("hubs/system-performance");

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToController(
    nameof(FallbackController.Index),
    nameof(FallbackController).Replace("Controller", "")
);

var obSettings = app.Services.GetRequiredService<OpenBulletSettingsService>().Settings;

if (RootChecker.IsRoot())
{
    Console.WriteLine(RootUtils.RootWarning);
}

if (obSettings.SecuritySettings.HttpsRedirect)
{
    app.UseHttpsRedirection();
}

// Cache the polymorphic types
PolyDtoCache.Scan();

// Apply DB migrations or create a DB if it doesn't exist
using (var serviceScope = app.Services.GetRequiredService<IServiceScopeFactory>().CreateScope())
{
    var context = serviceScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.Migrate();
}

// Load the configs
var configService = app.Services.GetRequiredService<ConfigService>();
await configService.ReloadConfigsAsync();

// Start the job monitor at the start of the application,
// otherwise it will only be started when navigating to the page
_ = app.Services.GetRequiredService<JobMonitorService>();

Globals.StartTime = DateTime.UtcNow;

app.Run();

// This makes Program visible for integration tests
#pragma warning disable S1118
/// <summary>
/// The main entry point for the application.
/// </summary>
public partial class Program
{
    
}
#pragma warning restore S1118
