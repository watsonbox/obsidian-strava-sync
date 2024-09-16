export class Plugin {
  app: any;
  manifest: any;

  constructor(app: any, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  loadData = jest.fn().mockResolvedValue({});
  saveData = jest.fn().mockResolvedValue({});
  addRibbonIcon = jest.fn();
  addCommand = jest.fn();
  addSettingTab = jest.fn();
}

export const App = jest.fn().mockImplementation(() => ({
  vault: {
    create: jest.fn(),
    getAbstractFileByPath: jest.fn(),
    createFolder: jest.fn(),
  },
}));

export const TFile = jest.fn();
export const TFolder = jest.fn();
export const Vault = jest.fn().mockImplementation(() => ({
  create: jest.fn(),
  getAbstractFileByPath: jest.fn(),
  createFolder: jest.fn(),
}));

export const Notice = jest.fn();
export const addIcon = jest.fn();
export const normalizePath = jest.fn().mockImplementation((path) => path);
export const PluginSettingTab = jest.fn();
export const Setting = jest.fn().mockImplementation(() => ({
  setName: jest.fn().mockReturnThis(),
  setDesc: jest.fn().mockReturnThis(),
  addText: jest.fn().mockReturnThis(),
  addTextArea: jest.fn().mockReturnThis(),
}));
