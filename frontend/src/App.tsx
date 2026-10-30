import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routers } from "./router";
import { LotteryProvider } from "./store/lottery";

const queryClient = new QueryClient();

const App = () => {
  const router = createBrowserRouter(routers);
  return (
    <QueryClientProvider client={queryClient}>
      <LotteryProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner
            theme="dark"
            toastOptions={{
              style: {
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--popover-foreground))",
              },
            }}
          />
          <RouterProvider router={router} />
        </TooltipProvider>
      </LotteryProvider>
    </QueryClientProvider>
  );
};

export default App;
