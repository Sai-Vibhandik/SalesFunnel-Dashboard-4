/**
 * Utility to handle API response extraction
 * The axios interceptor returns response.data directly
 * So responses are: { success: true, data: <actualData> }
 * or sometimes just the data directly
 */

/**
 * Extract data from API response
 * @param {any} response - The API response
 * @returns {any} - The extracted data
 */
export const extractData = (response) => {
  // If response has success and data properties, extract data
  if (response && response.success && response.data !== undefined) {
    return response.data;
  }
  // If response has data property (without success), extract data
  if (response && response.data !== undefined && typeof response.data === 'object') {
    return response.data;
  }
  // Otherwise return response as-is
  return response;
};

/**
 * Extract project data with assignedTeam
 * @param {any} response - The API response
 * @returns {object} - The project data with assignedTeam
 */
export const extractProjectData = (response) => {
  const data = extractData(response);
  console.log('extractProjectData:', {
    hasAssignedTeam: !!data?.assignedTeam,
    assignedTeamKeys: data?.assignedTeam ? Object.keys(data.assignedTeam) : [],
    contentWriters: data?.assignedTeam?.contentWriters?.length || 0,
    graphicDesigners: data?.assignedTeam?.graphicDesigners?.length || 0,
    videoEditors: data?.assignedTeam?.videoEditors?.length || 0
  });
  return data;
};

/**
 * Extract team by role data
 * @param {any} response - The API response
 * @returns {object} - The team data keyed by role
 */
export const extractTeamData = (response) => {
  const data = extractData(response);
  console.log('extractTeamData:', {
    roles: data ? Object.keys(data) : [],
    content_writer: data?.content_writer?.length || 0,
    graphic_designer: data?.graphic_designer?.length || 0,
    video_editor: data?.video_editor?.length || 0
  });
  return data || {};
};