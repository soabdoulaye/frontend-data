/**
 * Format a date for display in the UI
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than a minute
    if (diff < 60 * 1000) {
        return 'Just now';
    }

    // Less than an hour
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }

    // Format as date
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Format a time for display in the UI
 * @param date Date to format
 * @returns Formatted time string
 */
export const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Format a date and time for display in the UI
 * @param date Date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
