import React, { ReactNode } from "react";
import { BaseErrorBoundary } from "./base-error-boundary";

interface Props {
  title?: React.ReactNode; // the page title (kept for backwards compatibility)
  header?: React.ReactNode; // something behind title
  contentStyle?: React.CSSProperties;
  sectionStyle?: React.CSSProperties;
  children?: ReactNode;
  full?: boolean;
}

export const BasePage: React.FC<Props> = (props) => {
  const { header, contentStyle, full, children, sectionStyle } = props;

  return (
    <BaseErrorBoundary>
      <div className="base-page" data-windrag>
        {header ? (
          <header data-windrag style={{ userSelect: "none" }}>
            {header}
          </header>
        ) : null}

        <div className={full ? "base-container no-padding" : "base-container"}>
          <section style={sectionStyle}>
            <div className="base-content" style={contentStyle} data-windrag>
              {children}
            </div>
          </section>
        </div>
      </div>
    </BaseErrorBoundary>
  );
};
