import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface Props {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
}

export default function Barcode({ value, width = 1.6, height = 50, displayValue = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width,
        height,
        displayValue,
        background: 'transparent',
        lineColor: 'var(--text1, #fff)',
        margin: 4,
      });
    } catch {
      // invalid value — skip
    }
  }, [value, width, height, displayValue]);

  return <svg ref={svgRef} className="barcode-svg" />;
}
