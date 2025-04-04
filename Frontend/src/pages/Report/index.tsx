import { Icon } from "@iconify-icon/react"
import { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router"
import { useAuthContext } from "@/context/AuthContext"
import AppLoader from "@/components/AppLoader"

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, role } = useAuthContext();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || role !== "hr") {
        console.log("User is not authenticated, redirecting to auth page...");
        navigate("/admin/auth");
      }
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (location.pathname === "/report") {
      navigate("/report/all");
    }
    // console.log(location.pathname);
  }, [])

  return (
    <>
      {isLoading && <AppLoader></AppLoader>}
      {!isLoading && isAuthenticated && role == "hr" && (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="flex items-center gap-4 pb-6 pt-10 px-4 md:px-6 xl:px-40 2xl:px-60">
        <button onClick={() => {
          navigate("/admin");
        }} className="w-8 h-8 grid place-content-center  text-xl bg-neutral-900 rounded-md">
          <Icon icon={"oui-arrow-left"} />
        </button>
        <h2 className="text-3xl tracking-wider font-extralight">Employee/s Report</h2>
      </header>

      <Outlet />
    </main>
  )}
  </>)
}
export default ReportPage