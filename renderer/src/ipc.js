export const send = (channel, data) => window.electronAPI.send(channel, data);
export const on = (channel, callback) => window.electronAPI.on(channel, callback);
export const invoke = (channel, data) => window.electronAPI.handle(channel, data);
