import { NgModule, ModuleWithProviders, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticlesModule } from 'angular-particle';
import { ReactiveFormsModule } from '@angular/forms';
import { MdbModule } from "../shared/moduls/mdb/mdb.module";
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

const modules = [
  CommonModule,
  ParticlesModule,
  ReactiveFormsModule,
  FormsModule,
  HttpClientModule
];

@NgModule({
  imports: [
    modules,
    MdbModule.forRoot()
  ],
  exports: [
    modules,
    MdbModule
  ]
})
export class CoreModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreModule
    };
  }
}
