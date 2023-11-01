import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { TruncatePipe } from './pipes/truncate.pipe';
import { BytesPipe } from './pipes/bytes.pipe';
import { InputTextComponent } from './components/input-text/input-text.component';
import { InputNumberComponent } from './components/input-number/input-number.component';
import { InputDropdownComponent } from './components/input-dropdown/input-dropdown.component';
import { DropdownModule } from 'primeng/dropdown';
import { LolicodeEditorComponent } from './components/code-editor/code-editor.component';
import { MonacoEditorModule, NgxMonacoEditorConfig } from 'ngx-monaco-editor-v2';
import { FormsModule } from '@angular/forms';
import { registerLoliCode } from './languages/lolicode';
import { InputListComponent } from './components/input-list/input-list.component';
import { PascalCasePipe } from './pipes/pascalcase.pipe';
import { BooleanIconComponent } from './components/boolean-icon/boolean-icon.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MultipleSelectorComponent } from './components/multiple-selector/multiple-selector.component';
import { InputTimeSpanComponent } from './components/input-time-span/input-time-span.component';
import { TimeSpanPipe } from './pipes/timespan.pipe';

declare const monaco: any;

const monacoConfig: NgxMonacoEditorConfig = {
  onMonacoLoad() {
    registerLoliCode(monaco);
  },
  defaultOptions: {
    automaticLayout: true,
    fontFamily: 'Chivo Mono'
  }
};

@NgModule({
  declarations: [
    SpinnerComponent,
    TruncatePipe,
    BytesPipe,
    PascalCasePipe,
    TimeSpanPipe,
    InputTextComponent,
    InputNumberComponent,
    InputDropdownComponent,
    LolicodeEditorComponent,
    InputListComponent,
    BooleanIconComponent,
    MultipleSelectorComponent,
    InputTimeSpanComponent
  ],
  imports: [
    CommonModule,
    DropdownModule,
    MonacoEditorModule.forRoot(monacoConfig),
    FormsModule,
    FontAwesomeModule
  ],
  exports: [
    SpinnerComponent,
    TruncatePipe,
    BytesPipe,
    PascalCasePipe,
    TimeSpanPipe,
    InputTextComponent,
    InputNumberComponent,
    InputDropdownComponent,
    InputListComponent,
    LolicodeEditorComponent,
    BooleanIconComponent,
    MultipleSelectorComponent,
    InputTimeSpanComponent
  ]
})
export class SharedModule { }
