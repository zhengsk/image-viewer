import React, { useCallback, useEffect, useRef, useState } from 'react';
import './image-viewer.css';

export default function ImageViewer({ src }) {
  console.count('Render');

  const backgroundValues = ['black', 'white', 'grid'];
  
  const containerRef = useRef(null);
  const readyDrag = useRef(false);

  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0});
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0});
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0, height: 0, });
  const [degree, setDegree] = useState(0); // 旋转角度
  const mouseSource = useRef({x: 0, y: 0});
  const [background, setBackground] = useState(0);

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

  
  // 窗口变化自适应
  useEffect(() => {
    const resizeAction = () => {
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    resizeAction(); // 初始化

    window.addEventListener('resize', resizeAction);
    return () => { window.removeEventListener('resize', resizeAction)}
  }, []);

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

      setLoaded(true);
    }
    img.onerror = () => {
      console.info('图片加载失败');
    }
  }, [src, setLoaded]);

  // 加载完成
  useEffect(() => {
    if (loaded) {
      fitSize(); // 自适应 @TODO: 小图情况下
    }
  }, [loaded, fitSize])

  // 拖拽：mouseDown
  const onMouseDown = useCallback((e) => {
    console.info(e.clientX, e.clientY);
    mouseSource.current = {
      left: rect.left,
      top: rect.top,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    readyDrag.current = true;
  }, [rect]);

  // 拖拽：mouseMove
  const onMouseMove = useCallback((e) => {
    const source = mouseSource.current;
    if (
      readyDrag.current &&
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
  }, [dragging, setDragging, containerSize.width, containerSize.height]);

  // 拖拽：mouseUp
  const onMouseUp = useCallback((e) => {
    readyDrag.current = false;
    if (dragging) {
      setDragging(false);
    }
  }, [dragging]);

  // 切换自适应和1:1
  const toggleFit = useCallback(({x, y}) => {
    if (
      Math.abs((containerSize.width - 50 ) / rect.width - 1) < 0.01 ||
      Math.abs((containerSize.height - 50 ) / rect.height - 1) < 0.01
    ) {
      // 1 : 1 展示
      zoomTo({ zoom: 1, x, y, });
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

  // 双击图片
  const onDoubleClick = useCallback((e) => {
    if (e.detail % 2 === 1) { return false;}
    if (!e.currentTarget) { return false;}
    const currentTarget = e.currentTarget;

    toggleFit({
      x:  e.clientX - currentTarget.clientLeft,
      y: e.clientY - currentTarget.clientTop,
    });
  }, [toggleFit]);


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
      zoomTo({
        zoom: rect.width / naturalSize.width + (-e.deltaY * 0.001),
        x: e.clientX - currentTarget.clientLeft,
        y: e.clientY - currentTarget.clientTop,
      });
    }

  }, [naturalSize.width, rect.width, zoomTo]);

  // 旋转
  const rotate = useCallback(() => {
    setDegree((degree) => {
      degree += 90;

      // 交换宽高
      setNaturalSize(({width, height}) => {
        return {
          width: height,
          height: width,
        }
      });

      return degree;
    });
  }, []);

  // 切换背景
  const switchBackground = useCallback(() => {
    setBackground(background => {
      background += 1;
      if (background >= backgroundValues.length) {
        background = 0;
      }
      return background;
    });
  }, [backgroundValues.length]);

  return (
    <div
      className={`wrapper background_${backgroundValues[background]} ${dragging ? 'dragging' : ''}`}
      ref={containerRef}
      draggable={false}
      onMouseDown={onMouseDown}
      onMouseMoveCapture={onMouseMove}
      onMouseUpCapture={onMouseUp}
    >
      {
        loaded ? (
          <>
            <div
              className='imageWrapper'
              onWheelCapture={onWheel}
              onClickCapture={onDoubleClick}
              style={{
                transform: `translate(${rect.left}px, ${rect.top}px)`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
              }}
            >
              <img
                className='imageEle'
                src={src}
                alt="查看图片"
                draggable={false}
                style={{
                  width: `${degree % 180 === 0 ? rect.width : rect.height}px`,
                  height: `${degree % 180 === 0 ? rect.height : rect.width}px`,
                  transform: `rotate(${degree}deg)`
                }}
              />
            </div>
            <ul className='tools'>
              <li onClick={toggleFit}>
                { rect.width === naturalSize.width ? 
                  (<span>自适应</span>) :
                  (<span>1:1比例</span>)
                }
              </li>
              <li onClick={rotate}>
                <span>旋转 {degree % 360}°</span>
              </li>
              <li onClick={switchBackground}>
                <span>切换背景</span>
              </li>
            </ul>
            <span
              className='zoomValue'
              onClick={toggleFit}
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