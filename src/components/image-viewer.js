import React, { useCallback, useEffect, useRef, useState } from 'react';
import './image-viewer.css';

export default function ImageViewer({ src }) {
  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [rect, setRect] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const mouseSource = useRef({x: 0, y: 0});
  const [prepare, setPrepare] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setLoaded(true);
      setRect((rect) => ({
        ...rect,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));
    }
    img.onerror = () => {
      console.info('图片加载失败');
    }
  }, [src, setLoaded]);

  const onMouseDown = useCallback((e) => {
    console.info(e.clientX, e.clientY);
    mouseSource.current = {
      left: rect.left,
      top: rect.top,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    setPrepare(true);
  }, [rect]);

  const onMouseMove = useCallback((e) => {
    const source = mouseSource.current;
    if (
      prepare &&
      !dragging && (
        Math.abs(source.mouseX - e.clientX) >= 5 ||
        Math.abs(source.mouseY - e.clientY) >= 5
      )
    ) {
      setDragging(true);
    }

    if (dragging) {
      setRect((rect) => ({
        ...rect,
        left: source.left + (e.clientX -source.mouseX),
        top: source.top + (e.clientY - source.mouseY),
      }));
    }
  }, [prepare, dragging, setDragging]);

  const onMouseUp = useCallback((e) => {
    setPrepare(false);
    setDragging(false);
  }, [setDragging]);

  const onWheel = useCallback((e) => {
    if (!e.currentTarget) { return false;}
    const currentTarget = e.currentTarget;

    setRect((rect) => {
      const ratioX = (e.clientX - currentTarget.clientLeft - rect.left) / rect.width;
      const ratioY = (e.clientY - currentTarget.clientTop - rect.top) / rect.height;

      const offsetW = rect.width * 0.2 * (e.deltaY > 0 ? 1 : -1);
      const offsetH = offsetW / (rect.width / rect.height);

      return {
        left: rect.left - ratioX * offsetW,
        top: rect.top - ratioY * offsetH,
        width: rect.width + offsetW,
        height: rect.height + offsetH,
      }
    });
  }, []);

  return (
    <div
      className={'wrapper'}

      draggable={false}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}

      onWheel={onWheel}
    >
      {
        loaded ? (
          <img
            className='imgEle'
            src={src}
            alt="查看图片"
            draggable={false}
            style={{
              transform: `translate(${rect.left}px, ${rect.top}px)`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          />
        ) : (
          <span>加载中...</span>
        )
      }
      
    </div>
  );
}