import { Navigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export default function ProtectedRoute({ children }) {
  const { isLogin } = useSession();
  if (!isLogin) return <Navigate to="/login" replace />;
  return children;
}
