﻿namespace OpenBullet2.Web.Dtos.Job.MultiRun;

/// <summary>
/// Information about a config in a job.
/// </summary>
public class JobConfigDto
{
    /// <summary>
    /// The icon of the config.
    /// </summary>
    public string Base64Image { get; set; } = string.Empty;

    /// <summary>
    /// The name of the config.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The author of the config.
    /// </summary>
    public string Author { get; set; } = string.Empty;
}
