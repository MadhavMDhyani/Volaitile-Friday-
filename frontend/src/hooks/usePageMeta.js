import { useEffect } from 'react';

/**
 * Custom hook to update document title and meta description.
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.description
 */
export const usePageMeta = ({ title, description }) => {
  useEffect(() => {
    if (title) {
      document.title = title.includes('Volaitile Friday') ? title : `${title} | Volaitile Friday`;
    }
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
  }, [title, description]);
};

export default usePageMeta;
