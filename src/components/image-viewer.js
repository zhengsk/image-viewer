import React, { useCallback, useEffect, useRef, useState } from 'react';
import './image-viewer.css';

export default function ImageViewer({ src }) {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [rect, setRect] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0});
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0});

  const mouseSource = useRef({x: 0, y: 0});
  const [prepare, setPrepare] = useState(false);

  // 缩放
  const zoomTo = useCallback(({ zoom, x, y, alignCenter }) => {
    const currentTarget = containerRef.current;

    setRect((rect) => {
      if (alignCenter) {
        return {
          left: (containerSize.width - zoom * naturalSize.width) / 2,
          top: (containerSize.height - zoom * naturalSize.height) / 2,
          width: zoom * naturalSize.width,
          height: zoom * naturalSize.height,
        }
      } else {
        if (x === undefined) { x = rect.left + rect.width / 2 };
        if (y === undefined) { y = rect.top + rect.height / 2 };

        const ratioX = (x - currentTarget.clientLeft - rect.left) / rect.width;
        const ratioY = (y - currentTarget.clientTop - rect.top) / rect.height;

        let offsetW = zoom * naturalSize.width - rect.width;
        offsetW = rect.width + offsetW <= 50  ? 50  - rect.width : offsetW; // 最小100px
        offsetW = (rect.width + offsetW) / naturalSize.width >= 10 ?  naturalSize.width * 10 - rect.width : offsetW; // 最大10倍放大

        const offsetH = offsetW / (rect.width / rect.height);

        return {
          left: rect.left - ratioX * offsetW,
          top: rect.top - ratioY * offsetH,
          width: rect.width + offsetW,
          height: rect.height + offsetH,
        }
      }
    });
  }, [naturalSize.width, naturalSize.height, containerSize.width, containerSize.height]);

  // 自适应
  const fitSize = useCallback(() => {
     // 窗口适配居中展示
     const zoom = Math.min(
      (containerSize.width -50 ) / naturalSize.width,
      (containerSize.height -50 ) / naturalSize.height
    );

    zoomTo({
      zoom,
      alignCenter: true,
    });
  }, [zoomTo, containerSize, naturalSize.width, naturalSize.height]);

  useEffect(() => {
    setContainerSize({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })
  }, []);

  // 窗口变化自适应
  useEffect(() => {
    const resizeAction = () => {
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });

      // 窗口适配居中展示
      zoomTo({
        zoom: (containerRef.current.clientWidth -100 ) / naturalSize.width,
        alignCenter: true,
      });
    }
    window.addEventListener('resize', resizeAction);

    return () => { window.removeEventListener('resize', resizeAction)}
  }, [naturalSize.width, zoomTo]);

  // 图片加载完成
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setRect((rect) => ({
        ...rect,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));

      // 图片原始尺寸
      setNaturalSize({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

      fitSize(); // 自适应 @TODO: 小图情况下
      setLoaded(true);
    }
    img.onerror = () => {
      console.info('图片加载失败');
    }
  }, [src, setLoaded, fitSize, containerSize]);

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
      setRect((rect) => {
        let left = source.left + (e.clientX -source.mouseX);
        left = Math.max(-rect.width + 20, left);
        left = Math.min(containerSize.width - 20, left);
  
        let top =  source.top + (e.clientY - source.mouseY);
        top = Math.max(-rect.height + 20, top);
        top = Math.min(containerSize.height - 20, top);

        return {
          ...rect,
          left,
          top,
        };
      });
    }
  }, [prepare, dragging, setDragging, containerSize.width, containerSize.height]);

  const onMouseUp = useCallback((e) => {
    setPrepare(false);
    setDragging(false);
  }, [setDragging]);

  // 双击
  const onDoubleClick = useCallback((e) => {
    if (!e.currentTarget) { return false;}
    const currentTarget = e.currentTarget;

    if (
      Math.abs((containerSize.width - 50 ) / rect.width - 1) < 0.01 ||
      Math.abs((containerSize.height - 50 ) / rect.height - 1) < 0.01
    ) {
      // 1 : 1 展示
      zoomTo({
        zoom: 1,
        x: e.clientX - currentTarget.clientLeft,
        y: e.clientY - currentTarget.clientTop,
      });
    } else {
      // 窗口适配居中展示
      const zoom = Math.min(
        (containerSize.width -50 ) / naturalSize.width,
        (containerSize.height -50 ) / naturalSize.height
      );

      zoomTo({
        zoom,
        alignCenter: true,
      });
    }
  }, [zoomTo, rect.width, rect.height, containerSize, naturalSize]);

  // 滚轮
  const onWheel = useCallback((e) => {
    if (!e.currentTarget) { return false;}
    const currentTarget = e.currentTarget;

    if (e.ctrlKey || e.metaKey) {
      setRect((rect) => {
        const offsetW = e.deltaX * 0.15;
        const offsetH = e.deltaY * 0.15;
        return {
          ...rect,
          left: rect.left - offsetW,
          top: rect.top - offsetH,
        }
      });
    } else {
      setRect((rect) => {
        const ratioX = (e.clientX - currentTarget.clientLeft - rect.left) / rect.width;
        const ratioY = (e.clientY - currentTarget.clientTop - rect.top) / rect.height;
  
        let offsetW = rect.width * 0.3 * (e.deltaY > 0 ? -1 : 1);
        offsetW = rect.width + offsetW <= 50  ? 50  - rect.width : offsetW; // 最小100px
        offsetW = (rect.width + offsetW) / naturalSize.width >= 10 ?  naturalSize.width * 10 - rect.width : offsetW; // 最大10倍放大

        const offsetH = offsetW / (rect.width / rect.height);
  
        return {
          left: rect.left - ratioX * offsetW,
          top: rect.top - ratioY * offsetH,
          width: rect.width + offsetW,
          height: rect.height + offsetH,
        }
      });
    }

  }, [naturalSize.width]);

  return (
    <div
      className={'wrapper'}
      ref={containerRef}
      draggable={false}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {
        loaded ? (
          <>
            <img
              className='imgEle'
              src={src}
              alt="查看图片"
              draggable={false}
              onWheel={onWheel}
              onDoubleClickCapture={onDoubleClick}
              style={{
                transform: `translate(${rect.left}px, ${rect.top}px)`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
              }}
            />
            <span
              className='zoomValue'
              onClick={onDoubleClick}
            >
              { Math.round(rect.width / naturalSize.width * 100) }%
            </span>
          </>
        ) : (
          <span>加载中...</span>
        )
      }
      
    </div>
  );
}