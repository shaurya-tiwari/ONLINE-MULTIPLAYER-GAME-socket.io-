import React from 'react';
import grassImg from '../assets/grass/grass.png';

const CanvasCover = () => {
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Grass Image - Right Bottom Corner */}
            <img
                src={grassImg}
                alt="Grass Overlay"
                className="absolute right-0 bottom-0 select-none pointer-events-none w-auto h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] translate-x-[20%]"
            />
        </div>
    );
};

export default CanvasCover;
