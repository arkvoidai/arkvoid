import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase/client';
import { FileText, Download, Shield, Sparkles } from 'lucide-react';
import { sanitizeHtml } from '@/src/lib/sanitize';
import { Button } from '@/src/components/ui/button';

export function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!token) return;
      try {
        const { data, error } = await supabase
          .from('shared_reports')
          .select('*')
          .eq('token', token)
          .single();

        if (error) {
           if (error.code === 'PGRST116') {
              setError("Report not found or has expired.");
           } else {
              setError(error.message);
           }
        } else {
           // check expiry client-side just in case
           if (new Date(data.expires_at) < new Date()) {
              setError("This report has expired.");
           } else {
              setReport(data);
           }
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = (type: string) => {
    if (type === 'eu_ai_act') return 'EU AI Act Compliance Report';
    if (type === 'iso_42001') return 'ISO 42001 Compliance Report';
    return 'Executive Summary Report';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
           <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
           <p className="text-gray-500 font-medium">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center max-w-md w-full">
           <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <h2 className="text-xl font-bold text-gray-900 mb-2">Unavailable</h2>
           <p className="text-gray-600 mb-8">{error || "Report not found"}</p>
           <Link to="/">
             <Button variant="primary" className="w-full">Return Home</Button>
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-[850px] mx-auto relative">
        
        {/* Control Bar (No Print) */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between mb-8 shadow-sm no-print">
          <div className="text-gray-900 font-bold flex items-center gap-2 mb-4 sm:mb-0 text-lg tracking-tight">
            <span className="bg-black text-white px-2 py-1 rounded text-sm tracking-widest">ARKVOID</span>
            Shared Report
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
             <Button variant="primary" className="flex-1 sm:flex-none justify-center" onClick={handlePrint}>
               <Download className="w-4 h-4 mr-2" /> Download PDF
             </Button>
          </div>
        </div>

        {/* Document Content */}
        <div className="bg-white text-black p-8 sm:p-12 md:p-16 rounded-xl shadow-2xl border border-gray-200 print-content print:border-none print:shadow-none print:p-0">
           <div className="border-b-2 border-black pb-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
             <div>
               <h1 className="text-2xl sm:text-3xl font-bold mb-2 uppercase tracking-tight text-black">{getReportTitle(report.report_type)}</h1>
               <p className="text-gray-600 text-sm">Organization: <span className="font-semibold text-black">{report.org_email}</span></p>
               <p className="text-gray-600 text-sm mt-1">Generated: {new Date(report.created_at).toLocaleDateString()}</p>
             </div>
             <div className="text-left sm:text-right">
               <div className="font-bold text-xl tracking-widest text-black">ARKVOID</div>
               <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">AI Governance Platform</div>
             </div>
           </div>

           <div className="prose prose-sm sm:prose-base max-w-none text-black prose-headings:text-black prose-a:text-blue-600 prose-strong:text-black" dangerouslySetInnerHTML={{ __html: sanitizeHtml(report.content) }} />
           
           <div className="mt-16 pt-8 border-t border-gray-300 text-center text-xs text-gray-500 font-medium">
             Verified by ARKVOID Cryptographic Audit Trail<br />
             arkvoid.cherazen.com | Report ID: {report.token}
           </div>
        </div>
        
        {/* Conversion Funnel (No Print) */}
        <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center no-print">
           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-4">
             <Sparkles className="w-6 h-6" />
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">Want to generate compliance reports for your AI systems?</h3>
           <p className="text-gray-600 mb-6 max-w-lg mx-auto">
             ARKVOID provides real-time monitoring, cryptographic audit trails, and one-click compliance reporting for enterprise AI deployments.
           </p>
           <Link to="/auth/login">
             <Button variant="primary" className="px-8 bg-blue-600 hover:bg-blue-700 text-white">
               Start Free with ARKVOID <ChevronRight className="w-4 h-4 ml-2" />
             </Button>
           </Link>
        </div>

      </div>
    </div>
  );
}

// Just an inline ChevronRight for self-containment
function ChevronRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
