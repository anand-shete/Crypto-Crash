import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return <Sonner theme="dark" {...props} />;
};

export { Toaster };
