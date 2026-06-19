import type { CalloutSide, CalloutWidth, ResolvedCalloutSide } from "../../../types/lesson";

import {

  calloutWidthStyle,

  PIN_CALLOUT_FLIP_THRESHOLD_PCT,

  resolveCalloutSide,

  resolvePinCalloutContent,

  shouldFlipCallout,

} from "../../../utils/hotspots";

import SafeHtml from "../../wiki/components/SafeHtml";



type PinHotspotMarkerProps = {

  label?: string;

  descriptionHtml?: string;

  calloutWidth?: CalloutWidth;

  calloutSide?: CalloutSide;

  /** Center X of the pin in image percent — used for auto side near the right edge. */

  anchorXPct?: number;

  /** When false, only the anchor dot is shown (interactive student preview). Default: true. */

  showCallout?: boolean;

  /** When false, callout appears without entrance animation (editor always-on preview). Default: true. */

  animateCallout?: boolean;

};



/** Connector span from dot center to callout box edge (px). */

const CONNECTOR_WIDTH = 54;

const CONNECTOR_HEIGHT = 30;

const CONNECTOR_CORNER_RADIUS = 5;

const CONNECTOR_STUB = 12;



/**

 * Orthogonal leader line with 90° bends and rounded corners (SVG arcs).

 * Horizontal stub from dot → vertical bend → horizontal to callout edge.

 */

export function buildPinConnectorPath(

  width = CONNECTOR_WIDTH,

  height = CONNECTOR_HEIGHT,

  endY = height / 2,

  stubX = CONNECTOR_STUB,

  radius = CONNECTOR_CORNER_RADIUS,

): string {

  const startY = height / 2;



  if (Math.abs(endY - startY) < 0.01) {

    return `M 0 ${startY} H ${width}`;

  }



  const dy = endY > startY ? 1 : -1;

  const r = Math.min(radius, stubX, width - stubX, Math.abs(endY - startY));



  return [

    `M 0 ${startY}`,

    `H ${stubX - r}`,

    `A ${r} ${r} 0 0 1 ${stubX} ${startY + dy * r}`,

    `V ${endY - dy * r}`,

    `A ${r} ${r} 0 0 ${dy > 0 ? 1 : 0} ${stubX + r} ${endY}`,

    `H ${width}`,

  ].join(" ");

}



/**

 * Vertical-first orthogonal leader: stub from dot → horizontal bend → vertical to callout edge.

 */

export function buildPinConnectorPathVertical(

  width = CONNECTOR_HEIGHT,

  height = CONNECTOR_WIDTH,

  endX = width / 2,

  stubY = CONNECTOR_STUB,

  radius = CONNECTOR_CORNER_RADIUS,

  direction: "up" | "down" = "up",

): string {

  const startX = width / 2;



  if (direction === "up") {

    const startY = height;

    if (Math.abs(endX - startX) < 0.01) {

      return `M ${startX} ${startY} V 0`;

    }



    const dx = endX > startX ? 1 : -1;

    const r = Math.min(radius, stubY, height - stubY, Math.abs(endX - startX));



    return [

      `M ${startX} ${startY}`,

      `V ${startY - stubY + r}`,

      `A ${r} ${r} 0 0 ${dx > 0 ? 0 : 1} ${startX + dx * r} ${startY - stubY}`,

      `H ${endX - dx * r}`,

      `A ${r} ${r} 0 0 ${dx > 0 ? 1 : 0} ${endX} ${startY - stubY - r}`,

      `V 0`,

    ].join(" ");

  }



  const startY = 0;

  if (Math.abs(endX - startX) < 0.01) {

    return `M ${startX} ${startY} V ${height}`;

  }



  const dx = endX > startX ? 1 : -1;

  const r = Math.min(radius, stubY, height - stubY, Math.abs(endX - startX));



  return [

    `M ${startX} ${startY}`,

    `V ${stubY - r}`,

    `A ${r} ${r} 0 0 ${dx > 0 ? 1 : 0} ${startX + dx * r} ${stubY}`,

    `H ${endX - dx * r}`,

    `A ${r} ${r} 0 0 ${dx > 0 ? 0 : 1} ${endX} ${stubY + r}`,

    `V ${height}`,

  ].join(" ");

}



function connectorSideClass(side: ResolvedCalloutSide): string {

  return side === "right" ? "" : `hotspot-pin-connector--side-${side}`;

}



function calloutSideClass(side: ResolvedCalloutSide): string {

  return side === "right" ? "" : `hotspot-pin-callout--side-${side}`;

}



/** Orthogonal connector from anchor dot center to callout box. */

function PinConnector({ side }: { side: ResolvedCalloutSide }) {

  const className = ["hotspot-pin-connector", connectorSideClass(side)].filter(Boolean).join(" ");



  if (side === "top" || side === "bottom") {

    return (

      <svg

        className={className}

        viewBox={`0 0 ${CONNECTOR_HEIGHT} ${CONNECTOR_WIDTH}`}

        width={CONNECTOR_HEIGHT}

        height={CONNECTOR_WIDTH}

        aria-hidden

      >

        <path

          d={buildPinConnectorPathVertical(

            CONNECTOR_HEIGHT,

            CONNECTOR_WIDTH,

            CONNECTOR_HEIGHT / 2,

            CONNECTOR_STUB,

            CONNECTOR_CORNER_RADIUS,

            side === "top" ? "up" : "down",

          )}

          pathLength={100}

        />

      </svg>

    );

  }



  return (

    <svg

      className={className}

      viewBox={`0 0 ${CONNECTOR_WIDTH} ${CONNECTOR_HEIGHT}`}

      width={CONNECTOR_WIDTH}

      height={CONNECTOR_HEIGHT}

      aria-hidden

    >

      <path d={buildPinConnectorPath()} pathLength={100} />

    </svg>

  );

}



/** Shared pin marker: anchor dot + optional callout with orthogonal connector. */

export default function PinHotspotMarker({

  label,

  descriptionHtml,

  calloutWidth,

  calloutSide,

  anchorXPct,

  showCallout = true,

  animateCallout = true,

}: PinHotspotMarkerProps) {

  const callout = resolvePinCalloutContent(descriptionHtml, label);

  const side = resolveCalloutSide(calloutSide, anchorXPct);

  const widthStyle = calloutWidthStyle(calloutWidth);

  const calloutClassName = [

    "hotspot-pin-callout",

    calloutSideClass(side),

    !animateCallout ? "hotspot-pin-callout--static" : "",

  ]

    .filter(Boolean)

    .join(" ");



  return (

    <span className="hotspot-pin-marker">

      {callout && showCallout ? (

        <>

          <PinConnector side={side} />

          <span className={calloutClassName}>

            {callout.mode === "html" ? (

              <SafeHtml

                html={callout.html}

                className="hotspot-pin-callout-box hotspot-pin-callout-html"

                tag="div"

                style={widthStyle}

              />

            ) : (

              <span className="hotspot-pin-callout-box hotspot-pin-callout-text" style={widthStyle}>

                {callout.text}

              </span>

            )}

          </span>

        </>

      ) : null}

      <span className="hotspot-pin-dot" aria-hidden />

    </span>

  );

}



export { PIN_CALLOUT_FLIP_THRESHOLD_PCT as FLIP_THRESHOLD_PCT, shouldFlipCallout };


