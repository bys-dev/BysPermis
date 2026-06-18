"use client";

import { Component, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapLocationDot } from "@fortawesome/free-solid-svg-icons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Évite qu'une erreur Leaflet fasse planter toute la page /centres */
export class CentresMapBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[360px] sm:h-[480px] lg:h-[560px] w-full rounded-xl border border-brand-border bg-gray-50 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <FontAwesomeIcon icon={faMapLocationDot} className="text-3xl text-gray-300" />
          <p className="text-sm text-gray-600">
            La carte n&apos;a pas pu s&apos;afficher. Vous pouvez consulter la liste des centres ci-dessus.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
