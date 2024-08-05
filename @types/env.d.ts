declare global {
  namespace NodeJS {
    interface ProcessEnv {
      http_proxy?: string;
      https_proxy?: string;
      no_proxy?: string;
      npm_config_user_agent?: string;
    }
  }
}

export {};
