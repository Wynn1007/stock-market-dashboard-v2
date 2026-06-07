import React from 'react';
import { NewsItem } from '../types';

interface NewsFlashesProps {
    newsItems: NewsItem[];
    analysisFlashes: string[];
}

const NewsFlashes: React.FC<NewsFlashesProps> = ({ newsItems, analysisFlashes }) => {
    // Combine and unique flashes
    const allFlashes = [...analysisFlashes, ...newsItems.map(item => item.title)];
    const uniqueFlashes = Array.from(new Set(allFlashes)).slice(0, 5); // Limit to 5 flashes

    if (uniqueFlashes.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {uniqueFlashes.map((flash, index) => (
                <div key={index} className="text-xs p-2 bg-slate-800/50 rounded-md">
                   - {flash}
                </div>
            ))}
        </div>
    );
};

export default NewsFlashes;
