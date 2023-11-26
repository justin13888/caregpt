import React from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";

interface MarkdownDivProps {
  markdownContent: string;
}

const MarkdownDiv: React.FC<MarkdownDivProps> = ({ markdownContent }) => {
  return (
    <span className="markdown-div">
      <ReactMarkdown remarkPlugins={[gfm]}>{markdownContent}</ReactMarkdown>
    </span>
  );
};

export default MarkdownDiv;
