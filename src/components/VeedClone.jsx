import React, { useState, useRef, useEffect } from 'react';
import {
    Text,
    Button,
    Group,
    Stack,
    NumberInput,
    Title,
    FileInput,
    Modal,
    Select,
    Loader,
    Progress,
    Card
} from '@mantine/core';

const VeedClone = () => {
    const [media, setMedia] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [dimensions, setDimensions] = useState({ width: 750, height: 400 });
    const [timeRange, setTimeRange] = useState({ start: 0, end: 10 });
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportType, setExportType] = useState('screenshot');
    const [videoDuration, setVideoDuration] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const animationRef = useRef(null);

    const handleFileUpload = (file) => {
        if (!file) return;

        if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
            alert('Please upload a valid video or image file');
            return;
        }

        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('video') ? 'video' : 'image';

        setMedia(url);
        setMediaType(type);

        if (type === 'video') {
            const video = document.createElement('video');
            video.src = url;
            video.onloadedmetadata = () => {
                const duration = Math.floor(video.duration);
                setTimeRange({
                    start: 0,
                    end: duration
                });
                setVideoDuration(duration);
            };
            video.onerror = () => {
                alert('Error loading video file');
                setMedia(null);
                setMediaType(null);
            };
        }
    };

    const togglePlay = () => {
        if (mediaType === 'video' && videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                cancelAnimationFrame(animationRef.current);
            } else {
                if (currentTime >= timeRange.end) {
                    videoRef.current.currentTime = timeRange.start;
                    setCurrentTime(timeRange.start);
                }
                videoRef.current.play();
                animate();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const animate = () => {
        if (videoRef.current && mediaType === 'video') {
            const currentVideoTime = videoRef.current.currentTime;

            if (currentVideoTime >= timeRange.end) {
                videoRef.current.pause();
                setIsPlaying(false);
                setCurrentTime(timeRange.start);
                return;
            }

            setCurrentTime(currentVideoTime);
            animationRef.current = requestAnimationFrame(animate);
        }
    };

    useEffect(() => {
        return () => {
            cancelAnimationFrame(animationRef.current);
            if (media) URL.revokeObjectURL(media);
        };
    }, [media]);

    const handleTimeRangeChange = (type, value) => {
        setTimeRange(prev => {
            const newRange = { ...prev };
            if (type === 'start') {
                newRange.start = Math.min(value, prev.end - 0.1);
                if (videoRef.current && currentTime < newRange.start) {
                    videoRef.current.currentTime = newRange.start;
                    setCurrentTime(newRange.start);
                }
            } else {
                newRange.end = Math.min(Math.max(value, prev.start + 0.1), videoDuration);
                if (videoRef.current && currentTime > newRange.end) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                    videoRef.current.currentTime = newRange.start;
                    setCurrentTime(newRange.start);
                }
            }
            return newRange;
        });
    };

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const handleSize = 10;
        const right = position.x + dimensions.width;
        const bottom = position.y + dimensions.height;

        if (x > right - handleSize && y > bottom - handleSize) {
            setIsResizing(true);
            return;
        }

        if (x >= position.x && x <= position.x + dimensions.width &&
            y >= position.y && y <= position.y + dimensions.height) {
            setIsDragging(true);
            setDragOffset({
                x: x - position.x,
                y: y - position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging && !isResizing) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isDragging) {
            setPosition({
                x: x - dragOffset.x,
                y: y - dragOffset.y
            });
        }

        if (isResizing) {
            setDimensions({
                width: Math.max(50, x - position.x),
                height: Math.max(50, y - position.y)
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    const downloadFile = (url, filename) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportScreenshot = async () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        if (mediaType === 'video') {
            context.drawImage(videoRef.current, 0, 0, dimensions.width, dimensions.height);
        } else {
            const img = new Image();
            img.src = media;
            await new Promise((resolve) => {
                img.onload = resolve;
            });
            context.drawImage(img, 0, 0, dimensions.width, dimensions.height);
        }

        const dataUrl = canvas.toDataURL('image/png');
        downloadFile(dataUrl, 'screenshot.png');
    };

    const exportImage = () => {
        downloadFile(media, 'image.png');
    };

    const captureVideoSegment = async () => {
        return new Promise(async (resolve) => {
            const video = document.createElement('video');
            video.src = media;
            video.currentTime = timeRange.start;

            await new Promise((resolve) => {
                video.onloadeddata = resolve;
            });

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            const stream = canvas.captureStream();
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm'
            });

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
                const progress = Math.min(100, Math.round((e.timecode / ((timeRange.end - timeRange.start) * 1000)) * 100));
                setExportProgress(progress);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
            };

            mediaRecorder.start();

            const frameInterval = 1000 / 30;
            const durationMs = (timeRange.end - timeRange.start) * 1000;
            let elapsed = 0;

            const captureFrame = () => {
                if (elapsed >= durationMs) {
                    mediaRecorder.stop();
                    return;
                }

                video.currentTime = timeRange.start + (elapsed / 1000);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                elapsed += frameInterval;
                setTimeout(captureFrame, frameInterval);
            };

            captureFrame();
        });
    };

    const exportVideoSegment = async () => {
        const webmBlob = await captureVideoSegment();
        downloadFile(URL.createObjectURL(webmBlob), 'video-segment.mp4');
    };

    const handleExport = async () => {
        if (!media) return;

        setIsExporting(true);
        setExportProgress(0);

        try {
            if (exportType === 'screenshot') {
                await exportScreenshot();
            } else if (exportType === 'media' && mediaType === 'video') {
                await exportVideoSegment();
            } else if (exportType === 'media' && mediaType === 'image') {
                exportImage();
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

    const isMediaVisible = mediaType === 'image' ||
        (mediaType === 'video' && currentTime >= timeRange.start && currentTime <= timeRange.end);

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            backgroundColor: '#f8f9fa'
        }}>
            {/* Left sidebar */}
            <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{
                    width: '320px',
                    minWidth: '320px',
                    backgroundColor: 'white'
                }}
            >
                {media ? (
                    <Stack spacing="md">
                        <Group position="apart" align="center">
                            <Text size="lg" weight={700}>Media Controls</Text>
                            <Button
                                compact
                                variant="light"
                                color="red"
                                onClick={() => {
                                    setMedia(null);
                                    setMediaType(null);
                                    if (videoRef.current) {
                                        videoRef.current.pause();
                                        setIsPlaying(false);
                                    }
                                }}
                            >
                                Clear Media
                            </Button>
                        </Group>

                        <Card withBorder p="sm" radius="md">
                            <Text size="sm" weight={600} mb="sm">Dimensions</Text>
                            <Group grow>
                                <NumberInput
                                    label="Width"
                                    value={dimensions.width}
                                    onChange={(val) => setDimensions(prev => ({ ...prev, width: val }))}
                                    min={50}
                                    max={1000}
                                />
                                <NumberInput
                                    label="Height"
                                    value={dimensions.height}
                                    onChange={(val) => setDimensions(prev => ({ ...prev, height: val }))}
                                    min={50}
                                    max={1000}
                                />
                            </Group>
                        </Card>

                        <Card withBorder p="sm" radius="md">
                            <Text size="sm" weight={600} mb="sm">Position</Text>
                            <Group grow>
                                <NumberInput
                                    label="X Position"
                                    value={position.x}
                                    onChange={(val) => setPosition(prev => ({ ...prev, x: val }))}
                                    min={0}
                                />
                                <NumberInput
                                    label="Y Position"
                                    value={position.y}
                                    onChange={(val) => setPosition(prev => ({ ...prev, y: val }))}
                                    min={0}
                                />
                            </Group>
                        </Card>

                        {mediaType === 'video' && (
                            <Card withBorder p="sm" radius="md">
                                <Text size="sm" weight={600} mb="sm">Time Range</Text>
                                <NumberInput
                                    label="Start Time (s)"
                                    value={timeRange.start}
                                    onChange={(val) => handleTimeRangeChange('start', val)}
                                    min={0}
                                    max={timeRange.end - 0.1}
                                    precision={1}
                                    step={0.1}
                                    mb="sm"
                                />
                                <NumberInput
                                    label="End Time (s)"
                                    value={timeRange.end}
                                    onChange={(val) => handleTimeRangeChange('end', val)}
                                    min={timeRange.start + 0.1}
                                    max={videoDuration}
                                    precision={1}
                                    step={0.1}
                                />
                            </Card>
                        )}

                        {mediaType === 'video' && (
                            <Card withBorder p="sm" radius="md">
                                <Group position="apart">
                                    <Button
                                        onClick={togglePlay}
                                        fullWidth
                                        variant="light"
                                        color="blue"
                                        leftIcon={isPlaying ? null : <span>▶</span>}
                                    >
                                        {isPlaying ? 'Pause' : 'Play'}
                                    </Button>
                                    <Text size="sm" weight={500}>
                                        {currentTime.toFixed(1)}s / {timeRange.end.toFixed(1)}s
                                    </Text>
                                </Group>
                            </Card>
                        )}
                    </Stack>
                ) : (
                    <Stack
                        align="center"
                        justify="center"
                        spacing={8}
                        style={{
                            height: '100%',
                            padding: '24px 16px'
                        }}
                    >
                        <FileInput
                            placeholder="Click to upload"
                            label={
                                <Text size="sm" weight={500} mb={4}>
                                    Upload Media
                                </Text>
                            }
                            accept="video/*,image/*"
                            onChange={handleFileUpload}
                            icon={<span>📁</span>}
                            styles={{
                                root: {
                                    width: '100%',
                                },
                                input: {
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    border: '1px solid #ced4da',
                                    ':hover': {
                                        borderColor: '#228be6'
                                    }
                                },
                                label: {
                                    paddingBottom: 4
                                }
                            }}
                        />
                        <Text size="xs" c="dimmed">
                            Supported formats: MP4, MOV, AVI, PNG, JPG
                        </Text>
                    </Stack>
                )}
            </Card>

            {/* Main content area */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <Card
                    shadow="sm"
                    radius="md"
                    withBorder
                    style={{
                        borderLeft: 'none',
                        borderTop: 'none',
                        borderRight: 'none',
                        borderRadius: '0'
                    }}
                >
                    <Group position="apart" p="sm">
                        <Title order={3} color="blue">Video Editor</Title>
                        <Button
                            variant="gradient"
                            gradient={{ from: 'blue', to: 'cyan' }}
                            disabled={!media}
                            onClick={() => setIsExportModalOpen(true)}
                            leftIcon={<span>💾</span>}
                        >
                            Export
                        </Button>
                    </Group>
                </Card>

                {/* Canvas area */}
                <div
                    ref={canvasRef}
                    style={{
                        flex: 1,
                        position: 'relative',
                        backgroundColor: '#f0f2f5',
                        overflow: 'hidden',
                        cursor: isDragging ? 'grabbing' : isResizing ? 'nwse-resize' : 'default',
                        margin: '16px',
                        borderRadius: '8px'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {media && isMediaVisible && (
                        <div
                            style={{
                                position: 'absolute',
                                left: `${position.x}px`,
                                top: `${position.y}px`,
                                width: `${dimensions.width}px`,
                                height: `${dimensions.height}px`,
                                border: '2px dashed #4dabf7',
                                cursor: isDragging ? 'grabbing' : 'grab',
                                touchAction: 'none',
                                zIndex: 10,
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                            }}
                        >
                            {mediaType === 'video' ? (
                                <video
                                    ref={videoRef}
                                    src={media}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        pointerEvents: 'none',
                                        backgroundColor: '#000'
                                    }}
                                    autoPlay={false}
                                    muted
                                    onTimeUpdate={() => {
                                        if (videoRef.current) {
                                            const currentVideoTime = videoRef.current.currentTime;
                                            if (currentVideoTime >= timeRange.end) {
                                                videoRef.current.pause();
                                                setIsPlaying(false);
                                                setCurrentTime(timeRange.start);
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <img
                                    src={media}
                                    alt="Uploaded content"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        pointerEvents: 'none'
                                    }}
                                />
                            )}
                            <div
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    bottom: 0,
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: '#4dabf7',
                                    cursor: 'nwse-resize',
                                    borderRadius: '2px'
                                }}
                            />
                        </div>
                    )}

                    {!media && (
                        <Stack align="center" justify="center" style={{ height: '100%' }}>
                            <Text size="xl" color="dimmed" weight={500}>
                                {mediaType ? 'Media loaded' : 'Upload a file to get started'}
                            </Text>
                            {!media && (
                                <Text size="sm">
                                    <a
                                        href="https://yashmavani.tech"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: '#228be6', // Using Mantine's primary blue color
                                            textDecoration: 'none',
                                            fontWeight: 500,
                                            ':hover': {
                                                textDecoration: 'underline'
                                            }
                                        }}
                                    >
                                        Yash Mavani
                                    </a> Production
                                </Text>
                            )}
                        </Stack>
                    )}
                </div>
            </div>

            {/* Export Modal */}
            <Modal
                opened={isExportModalOpen}
                onClose={() => !isExporting && setIsExportModalOpen(false)}
                title={<Text size="lg" weight={600}>Export Options</Text>}
                closeOnClickOutside={!isExporting}
                withCloseButton={!isExporting}
                size="md"
                centered
            >
                <Stack spacing="lg">
                    <Select
                        label="Select export format"
                        value={exportType}
                        onChange={setExportType}
                        data={[
                            { value: 'screenshot', label: 'Screenshot (PNG)' },
                            { value: 'media', label: mediaType === 'video' ? 'Video (MP4)' : 'Original Image' }
                        ]}
                        disabled={isExporting}
                    />

                    {isExporting && (
                        <div>
                            <Progress
                                value={exportProgress}
                                striped
                                animate
                                size="lg"
                                mb="sm"
                            />
                            <Text size="sm" color="dimmed" align="center">
                                Exporting {exportType === 'screenshot' ? 'screenshot' : 'video'}... {exportProgress}%
                            </Text>
                        </div>
                    )}

                    <Button
                        onClick={handleExport}
                        fullWidth
                        size="md"
                        disabled={isExporting}
                        loading={isExporting}
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'cyan' }}
                    >
                        {isExporting ? 'Exporting...' : 'Start Export'}
                    </Button>
                </Stack>
            </Modal>
        </div>
    );
};

export default VeedClone;