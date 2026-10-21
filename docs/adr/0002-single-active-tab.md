# Single Active tab

Only one browser tab may run Sessions and Breaks. Additional tabs detect the Active tab, show that Flowtimer is already open, and block Start/Stop until that tab is closed. Chosen over allowing parallel tabs (or warn-but-still-run) because two live timers would desync Breaks and could double-increment the daily Session count. Good enough for a personal desktop app; not a hard guarantee across separate browser profiles.
