/* eslint-disable react-refresh/only-export-components */
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";

interface ReportContextType {
  employeeIds: string[];
  setEmployeeIds: Dispatch<SetStateAction<string[]>>;
}

const ReportContext = createContext<ReportContextType>({
  employeeIds: [],
  setEmployeeIds: () => {},
});

const useReportContext = () => useContext(ReportContext);

const ReportProvider = ({ children }: { children: ReactNode }) => {
  const [employeeIds, setEmployeeIds] = useState<string[]>([])
  
  return (
    <ReportContext.Provider value={{ employeeIds, setEmployeeIds }}>
      {children}
    </ReportContext.Provider>
  );
};

export { useReportContext };
export default ReportProvider;
