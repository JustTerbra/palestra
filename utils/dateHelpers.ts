export const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const calculateStreak = (dates: string[]) => {
    if (dates.length === 0) return { current: 0, longest: 0 };
    
    const uniqueTimestamps = [...new Set(
        dates.map(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0); // Normalize to start of day
            return date.getTime();
        })
    )].sort((a, b) => b - a);
    
    if (uniqueTimestamps.length === 0) return { current: 0, longest: 0 };

    let longest = 0;
    let current = 0;

    // Calculate current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mostRecentDate = new Date(uniqueTimestamps[0]);

    if (mostRecentDate.getTime() === today.getTime() || mostRecentDate.getTime() === today.getTime() - DAY_IN_MS) {
        current = 1;
        for (let i = 0; i < uniqueTimestamps.length - 1; i++) {
            const diff = uniqueTimestamps[i] - uniqueTimestamps[i + 1];
            if (diff === DAY_IN_MS) {
                current++;
            } else {
                break;
            }
        }
    }

    // Calculate longest streak
    if (uniqueTimestamps.length > 0) {
        longest = 1;
        let tempStreak = 1;
        for (let i = 0; i < uniqueTimestamps.length - 1; i++) {
            const diff = uniqueTimestamps[i] - uniqueTimestamps[i + 1];
            if (diff === DAY_IN_MS) {
                tempStreak++;
            } else {
                longest = Math.max(longest, tempStreak);
                tempStreak = 1;
            }
        }
        longest = Math.max(longest, tempStreak);
    } else {
        longest = 0;
    }

    return { current, longest };
};
