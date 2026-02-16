import { useEffect } from "react";

const ConsoleCleaner = () => {
  useEffect(() => {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      console.info = () => {};
      console.debug = () => {};
  }, []);

  return null;
};

export default ConsoleCleaner;
