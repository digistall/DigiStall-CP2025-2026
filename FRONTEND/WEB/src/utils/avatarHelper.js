import { ref } from 'vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Hook to get avatar logic for Vue components
 */
export function useAvatar() {
  const getAvatarUrl = (stallholderId) => {
    if (!stallholderId) return null;
    return `${API_BASE_URL}/face/${stallholderId}`;
  };

  const handleAvatarError = (event) => {
    // Hide the image element if it fails to load
    event.target.style.display = 'none';
    
    // Find the initials container sibling and make it visible
    const parent = event.target.parentElement;
    if (parent) {
      const initials = parent.querySelector('.avatar-initials');
      if (initials) {
        initials.style.display = 'flex';
      }
    }
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}` || 'GU';
  };

  return {
    getAvatarUrl,
    handleAvatarError,
    getInitials
  };
}
