import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import TemplateMapping from "./pages/TemplateMapping";
import Dashboard from "./pages/Dashboard";
import DashboardNew from "./pages/DashboardNew";
import UploadInvoices from "./pages/UploadInvoices";
import TemplateMappingPre from "./pages/TemplateMappingPre";
import TemplateMappingDetail from "./pages/TemplateMappingDetail";
import ExtractInvoice from "./pages/ExtractInvoice";
import ConsoleCleaner from "./pages/ConsoleCleaner";

export const url = "http://192.168.1.2:5001/";

function App() {

  return (
    <BrowserRouter>
    <ConsoleCleaner />
        <Routes>
          <Route path="/template-mapping" element={<TemplateMapping />} />
          <Route path="/template-mapping-pre" element={<TemplateMappingPre />} />
          <Route path="/template-mapping-detail" element={<TemplateMappingDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload-invoice" element={<UploadInvoices />} />
          <Route path="/extract-invoice" element={<ExtractInvoice />} />
          <Route path="/dashboard-1" element={<DashboardNew />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
