import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';

export function BlogArticle() {
  const { slug } = useParams();
  
  return (
    <div className="bg-black min-h-screen pt-32 pb-24 text-white font-sans flex flex-col items-center justify-center">
      <Helmet>
        <title>Article | ARKVOID Blog</title>
      </Helmet>
      <div className="max-w-[600px] mx-auto px-6 text-center">
        <h1 className="text-[36px] font-bold text-white mb-6">Article coming soon</h1>
        <p className="text-[17px] text-[#A1A1A6] mb-8">
          We're currently writing this piece. Full articles will be available soon.
        </p>
        <Link to="/blog" className="text-[#E8D5B0] text-[14px] font-semibold hover:underline flex items-center justify-center gap-2">
          &larr; Back to Blog
        </Link>
      </div>
    </div>
  );
}
