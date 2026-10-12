// Messages of the project pages (stories/E3-1; docs/copy/errors.md and app.md), without a
// database import so the client forms can show them.
export const PROJECTS_COPY = {
  // The tile picker (stories/E3-8, decision 0066).
  tile: {
    choose: (project: string) => `Choose the icon and colour of ${project}`,
    icons: "Icons",
    colours: "Colours",
    reset: "Back to the initials",
    notAChoice: "That is not one of the icons or colours on offer. Pick one from the list.",
    notSaved: "The tile was not saved. Try again.",
  },
  badName: "Enter a name for the project, up to 80 characters.",
  planFull: "Your plan has no room for another project. Change the plan.",
  saved: "Saved.",
  // The Import cards' titles (docs/copy/app.md), as the unsaved changes guard names them
  // (stories/E5-9).
  aboutCard: "About this project",
  listCard: "The list",
  sample: "The sample project cannot be edited.",
  // The band on every screen of the sample (stories/E8-8, acceptance 1; CLAUDE.md, dashboard
  // rules): never dismissed.
  sampleBand: "Sample data: invented answers, for looking around",
  deleteSampleConfirm: "The sample project and its invented answers are deleted. Your own projects are not affected.",
};
