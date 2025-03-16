interface NodeModule {
    hot?: {
      accept: (callback?: () => void) => void;
      dispose: (callback: (data: any) => void) => void;
    };
  }
  
  declare var module: NodeModule;