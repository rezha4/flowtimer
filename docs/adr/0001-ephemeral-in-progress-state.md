# Ephemeral in-progress timer state

Flowtimer is a browser tab app. We deliberately do **not** restore an in-progress Session, Pause, or Break after refresh or close — that progress is lost. Leaving the page while a Session or Break is active shows a browser leave warning. Preferences (rest ratio, Session minimum, notification settings) and the daily Session count **do** persist. Chosen over resume-from-storage so the model stays simple and “close tab = done with this attempt,” accepting the cost that a crash mid-Session forfeits that Session’s elapsed time.
