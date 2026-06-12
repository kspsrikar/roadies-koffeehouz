"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.75, 0.95] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      ref={containerRef}
      style={{
        height: isMobile ? "40rem" : "65rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: isMobile ? "8px" : "40px",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          paddingTop: isMobile ? "10px" : "40px",
          paddingBottom: isMobile ? "10px" : "40px",
          width: "100%",
          position: "relative",
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale} isMobile={isMobile}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
        maxWidth: "1024px",
        marginLeft: "auto",
        marginRight: "auto",
        textAlign: "center"
      }}
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
  isMobile,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
  isMobile: boolean;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
        maxWidth: "1024px",
        marginTop: isMobile ? "-1rem" : "-3rem",
        marginLeft: "auto",
        marginRight: "auto",
        height: isMobile ? "22rem" : "32rem",
        width: "100%",
        border: "4px solid #6C6C6C",
        padding: isMobile ? "8px" : "20px",
        backgroundColor: "#1c1c1f",
        borderRadius: "30px",
      }}
    >
      <div style={{
        height: "100%",
        width: "100%",
        overflow: "hidden",
        borderRadius: "16px",
        backgroundColor: "#121214",
        padding: isMobile ? "8px" : "16px"
      }}>
        {children}
      </div>
    </motion.div>
  );
};

