module.exports = {
  apps: [
    {
      name: "kostinn-api",
      script: "./index.js", 
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      // Logging configuration
      // error_file: "C:\IDETAMA\pm2-log\kostinn-api\kostinn-api-error.log",
      // out_file: "C:\IDETAMA\pm2-log\kostinn-api\kostinn-api-out.log",
      // log_file: "C:\IDETAMA\pm2-log\kostinn-api\kostinn-api-combined.log", // optional combined file
      error_file: "kostinn-api-error.log",
      out_file: "kostinn-api-out.log",
      log_file: "kostinn-api-combined.log", // optional combined file
      time: true, // adds timestamps to logs
    },
  ],
};