export const useInputUtils = () => {
  const numInput = e => {
    const regex = /[^0-9]/g;
    if (regex.test(e.target.value)) {
      e.target.value = e.target.value.replace(regex, "");
    }
  };

  return {
    numInput,
  };
};
