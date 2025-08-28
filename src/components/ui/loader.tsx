import loadingAnimation from "../../../public/assets/lottie/animation-loader.json";
import Lottie from "lottie-react";
import React from "react";

const Loader: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Lottie
        animationData={loadingAnimation}
        autoPlay
        loop
        className="w-25"
      />
    </div>
  );
};

export default Loader;
