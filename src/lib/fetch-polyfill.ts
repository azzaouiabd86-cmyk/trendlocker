
const _fetch = window.fetch.bind(window);
export default _fetch;
export { _fetch as fetch };
export const Headers = window.Headers;
export const Request = window.Request;
export const Response = window.Response;
export const FormData = window.FormData;

// Satisfy node-fetch requirements
export const formDataToBlob = (fd: any) => {
  if (fd instanceof window.FormData) {
    // In browser, we don't really need to convert to blob for fetch
    return fd;
  }
  return fd;
};
