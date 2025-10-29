export const useDebounceUtils = () => {
  const debounceFn = (fn, delay = 300) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  };
  return {
    debounceFn,
  };
};
