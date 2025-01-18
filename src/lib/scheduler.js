const HOURS_PER_WEEK = 40; // Standard work week

function calculateWeeksNeeded(hours) {
  return Math.ceil(hours / HOURS_PER_WEEK);
}

/**
 * Calculate project schedule and assignments
 */
export function calculateSchedule(projects, engineers) {
  // Initialize engineer weekly hours tracking
  const engineerHours = {};
  engineers.forEach((eng) => {
    engineerHours[eng.id] = {
      currentWeek: 0,
      hoursRemaining: HOURS_PER_WEEK,
    };
  });

  // Sort projects by priority (lower number = higher priority)
  const sortedProjects = [...projects].sort((a, b) => a.priority - b.priority);

  const assignments = [];

  // Schedule each project
  sortedProjects.forEach((project) => {
    if (!project.allocations?.length || !project.estimatedHours) {
      console.warn(
        `Project ${project.name} skipped - missing allocations or hours`,
      );
      return;
    }

    // Get unique engineers from allocations
    const projectEngineers = [
      ...new Set(project.allocations.map((a) => a.engineerId)),
    ];

    // Calculate hours per engineer for this project
    const hoursPerEngineer = Math.ceil(
      project.estimatedHours / projectEngineers.length,
    );

    // Find the earliest week where all assigned engineers have availability
    const startWeek = Math.max(
      ...projectEngineers.map(
        (engId) => engineerHours[engId]?.currentWeek || 0,
      ),
    );

    // Calculate weeks needed based on hours per engineer
    const weeksNeeded = calculateWeeksNeeded(hoursPerEngineer);

    // Record assignments and update engineer hours
    projectEngineers.forEach((engId) => {
      // Check if engineer exists
      if (!engineerHours[engId]) {
        console.warn(`Engineer ${engId} not found for project ${project.name}`);
        return;
      }

      assignments.push({
        projectName: project.name,
        engineerId: engId,
        startWeek,
        weeksNeeded,
      });

      // Update engineer's schedule
      engineerHours[engId].currentWeek = startWeek + weeksNeeded;
    });
  });

  return assignments;
}

/**
 * Generate Mermaid Gantt chart markup from schedule
 */
export function generateMermaidGantt(assignments, engineers) {
  let mermaidMarkup = "gantt\n";
  mermaidMarkup += "    dateFormat  YYYY-MM-DD\n";
  mermaidMarkup += `    title Project Schedule\n`;
  mermaidMarkup += "    excludes weekends\n\n";

  // Group by engineer
  engineers.forEach((engineer) => {
    mermaidMarkup += `    section ${engineer.name}\n`;

    const engineerAssignments = assignments.filter(
      (a) => a.engineerId === engineer.id,
    );
    engineerAssignments.forEach((assignment) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + assignment.startWeek * 7);
      const formattedStart = startDate.toISOString().split("T")[0];

      mermaidMarkup += `    ${assignment.projectName}    :${formattedStart}, ${assignment.weeksNeeded}w\n`;
    });
  });

  return mermaidMarkup;
}
