$path = 'C:\Users\viann\OneDrive\Desktop\qworshipdesktop\Qworship-desktop\apps\client\src\features\dashboard\hooks\useHandsfreeBible.ts'
$content = Get-Content -Raw -Path $path

$old1 = @'
  useEffect(() => {
    liveWindowRef.current = liveWindow;
  }, [liveWindow]);

  const {
'@

$new1 = @'
  useEffect(() => {
    liveWindowRef.current = liveWindow;
  }, [liveWindow]);

  const syncProjectedVerseVersion = useCallback((nextVersion: string) => {
    setZustandBibleVersion(nextVersion);

    const currentContext = currentVerseContextRef.current;
    const primaryVerse = getPrimaryVerse(widgetVerseData);
    if (!currentContext || !primaryVerse) {
      return;
    }

    const rangeBounds = getVerseRangeBounds(widgetVerseData) ?? {
      verseStart: primaryVerse.verse,
      verseEnd: primaryVerse.verse,
    };
    const referenceLabel =
      widgetFormattedReference ??
      buildReferenceLabel(
        currentContext.book,
        currentContext.chapter,
        rangeBounds.verseStart,
        rangeBounds.verseEnd,
      );
    const text = getVerseTextForVersion(primaryVerse, nextVersion);

    setZustandVerse(
      buildVerseForStore(currentContext.book, currentContext.chapter, primaryVerse),
      referenceLabel,
    );
    useHFBStore.getState().setHfbCurrentProjected({
      reference: referenceLabel,
      text,
      version: nextVersion,
    });

    const currentLiveWindow = liveWindowRef.current;
    if (isWindowOpen(currentLiveWindow)) {
      currentLiveWindow!.postMessage(
        {
          type: "BIBLE_VERSE_DISPLAY",
          data: {
            book: currentContext.book,
            chapter: currentContext.chapter,
            verse: primaryVerse.verse,
            text,
            version: nextVersion,
            reference: referenceLabel,
          },
        },
        "*",
      );
    }
  }, [setZustandBibleVersion, setZustandVerse, widgetFormattedReference, widgetVerseData]);

  const {
'@

$old2 = @'
    onVersionChange: (version) => {
      resetInactivityTimer();
      const normalized = version.toUpperCase();
      setSelectedBibleVersion(normalized);
      setZustandBibleVersion(normalized);
      useHFBStore.getState().setHfbVersion(normalized);
      setDetectedCommands(`Switched to ${normalized}`);
    },
'@

$new2 = @'
    onVersionChange: (version) => {
      resetInactivityTimer();
      const normalized = version.toUpperCase();
      setSelectedBibleVersion(normalized);
      useHFBStore.getState().setHfbVersion(normalized);
      syncProjectedVerseVersion(normalized);
      setDetectedCommands(`Switched to ${normalized}`);
    },
'@

$old3 = @'
  const handleSetBibleVersion = (version: string) => {
    const normalized = version.toUpperCase();
    setSelectedBibleVersion(normalized);
    setZustandBibleVersion(normalized);
    useHFBStore.getState().setHfbVersion(normalized);
  };
'@

$new3 = @'
  const handleSetBibleVersion = (version: string) => {
    const normalized = version.toUpperCase();
    setSelectedBibleVersion(normalized);
    useHFBStore.getState().setHfbVersion(normalized);
    syncProjectedVerseVersion(normalized);
  };
'@

if (-not $content.Contains($old1)) { throw 'Anchor 1 not found' }
if (-not $content.Contains($old2)) { throw 'Anchor 2 not found' }
if (-not $content.Contains($old3)) { throw 'Anchor 3 not found' }

$content = $content.Replace($old1, $new1)
$content = $content.Replace($old2, $new2)
$content = $content.Replace($old3, $new3)
Set-Content -Path $path -Value $content
Write-Host 'translation sync fix applied'
