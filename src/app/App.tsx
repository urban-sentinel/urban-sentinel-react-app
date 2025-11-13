import { RouterProvider } from "react-router-dom";
import { browserRouter } from "./router/routes";

const router = browserRouter;

export default function App() {
  return <RouterProvider router={router} />;
}