import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { AppRoutes } from "@/routes/AppRoutes";
import { ThemeProvider } from "@/hooks/useTheme";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <AppRoutes />
            <ThemeToggle />
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
