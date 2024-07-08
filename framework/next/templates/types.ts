import { PackageManager } from '../../../helpers';

// add it when create template
export type TemplateType = 'app-empty' | 'app' | 'pages' | 'pages-empty';

export type TemplateMode = 'js' | 'ts';

export interface InstallTemplateArgs {
  appName: string;
  root: string;
  packageManager: PackageManager;
  isOnline: boolean;
  template: TemplateType;
  mode: TemplateMode;
  eslint: boolean;
  srcDir: boolean;
  importAlias: string;
  skipInstall: boolean;
  turbo: boolean;
}

export interface GetTemplateFileArgs {
  template: TemplateType;
  mode: TemplateMode;
  file: string;
}
