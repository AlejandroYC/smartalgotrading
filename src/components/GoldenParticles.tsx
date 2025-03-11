// Comenta todo el contenido por ahora
/*
'use client';
import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import type { Engine } from "tsparticles-engine";

const GoldenParticles = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        background: {
          color: "transparent",
        },
        particles: {
          color: {
            value: ["#DAA520", "#FFD700", "#B8860B", "#CD853F"],
          },
          move: {
            direction: "top",
            enable: true,
            outModes: {
              default: "out",
            },
            random: false,
            speed: { min: 0.5, max: 1 },
            straight: false,
            path: {
              enable: true,
              delay: {
                value: 0.1
              },
            },
          },
          number: {
            density: {
              enable: true,
              area: 1000,
            },
            value: 50,
          },
          opacity: {
            value: { min: 0.05, max: 0.2 },
            animation: {
              enable: true,
              speed: 0.5,
              sync: false,
            },
          },
          shape: {
            type: ["circle", "triangle"],
          },
          size: {
            value: { min: 2, max: 5 },
            animation: {
              enable: true,
              speed: 1,
              sync: false,
            },
          },
          rotate: {
            value: 0,
            direction: "random",
            animation: {
              enable: true,
              speed: 1,
            },
          },
          tilt: {
            enable: true,
            value: {
              min: 0,
              max: 360,
            },
            animation: {
              enable: true,
              speed: 1,
            },
          },
        },
      }}
    />
  );
};

export default GoldenParticles;
*/

// Exporta un componente vacío por ahora
const GoldenParticles = () => null;
export default GoldenParticles; 