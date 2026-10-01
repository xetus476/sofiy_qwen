// Версия сборки — меняется при каждом деплое
export const BUILD_VERSION = '2.0.0-' + new Date().toISOString().split('T')[0];
export const BUILD_TIME = new Date().toLocaleString('ru-RU');
