import React, { useRef } from 'react';
import { Button, Tooltip, Text, Container, useMantineColorScheme, ActionIcon } from '@mantine/core';

const DiscordColorGenerator = () => {
    const textareaRef = useRef(null);
    const copyBtnRef = useRef(null);
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';

    const colors = {
        text: dark ? '#E0E0E0' : '#1A1A1A',
        background: dark ? '#2C2F33' : '#F4F4F4',
        textareaBg: dark ? '#23272A' : '#FFFFFF',
        textareaText: dark ? '#B9BBBE' : '#36393F',
        textareaBorder: dark ? '#202225' : '#BDBDBD',
        buttonBg: dark ? '#4F545C' : '#E9ECEF',
        buttonText: dark ? '#FFFFFF' : '#000000',
        link: '#00AFF4',
        accentColor: '#5865F2'
    };

    const tooltipTexts = {
        "30": "Dark Gray (33%)",
        "31": "Red",
        "32": "Yellowish Green",
        "33": "Gold",
        "34": "Light Blue",
        "35": "Pink",
        "36": "Teal",
        "37": "White",
        "40": "Blueish Black",
        "41": "Rust Brown",
        "42": "Gray (40%)",
        "43": "Gray (45%)",
        "44": "Light Gray (55%)",
        "45": "Blurple",
        "46": "Light Gray (60%)",
        "47": "Cream White",
    };

    const getBgColor = (code) => {
        const colors = {
            40: '#002b36',
            41: '#cb4b16',
            42: '#586e75',
            43: '#657b83',
            44: '#839496',
            45: '#6c71c4',
            46: '#93a1a1',
            47: '#fdf6e3'
        };
        return colors[code];
    };

    const handleStyleButtonClick = (ansiCode) => {
        const selection = window.getSelection();
        const text = selection.toString();
        if (!text) return;

        const span = document.createElement("span");
        span.innerText = text;
        span.classList.add(`ansi-${ansiCode}`);

        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(span);
    };

    const nodesToANSI = (nodes, states) => {
        let text = "";
        for (const node of nodes) {
            if (node.nodeType === 3) {
                text += node.textContent;
                continue;
            }
            if (node.nodeName === "BR") {
                text += "\n";
                continue;
            }
            const ansiCode = +(node.className.split("-")[1]);
            const newState = Object.assign({}, states.at(-1));

            if (ansiCode < 30) newState.st = ansiCode;
            if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode;
            if (ansiCode >= 40) newState.bg = ansiCode;

            states.push(newState);
            text += `\x1b[${newState.st};${(ansiCode >= 40) ? newState.bg : newState.fg}m`;
            text += nodesToANSI(node.childNodes, states);
            states.pop();
            text += `\x1b[0m`;
            if (states.at(-1).fg !== 2) text += `\x1b[${states.at(-1).st};${states.at(-1).fg}m`;
            if (states.at(-1).bg !== 2) text += `\x1b[${states.at(-1).st};${states.at(-1).bg}m`;
        }
        return text;
    };

    const handleCopy = () => {
        const toCopy = "```ansi\n" + nodesToANSI(textareaRef.current.childNodes, [{ fg: 2, bg: 2, st: 2 }]) + "\n```";
        navigator.clipboard.writeText(toCopy).then(() => {
            copyBtnRef.current.innerText = "Copied!";
            setTimeout(() => {
                copyBtnRef.current.innerText = "Copy text as Discord formatted";
            }, 2000);
        }, (err) => {
            alert("Copying failed. Here's the text to copy manually:");
            alert(toCopy);
        });
    };

    return (
        <Container size="lg" py="xl"
            style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                color: colors.text,
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                transition: 'background-color 0.3s ease, color 0.3s ease'
            }}
        >
            <ActionIcon
                variant="outline"
                color={dark ? 'yellow' : 'black'}
                onClick={() => toggleColorScheme()}
                size="xl"
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    cursor: 'pointer',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                        backgroundColor: dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                    }
                }}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {dark ? '☀️' : '🌙'}
            </ActionIcon>

            <div style={{
                maxWidth: '700px',
                width: '100%',
                backgroundColor: colors.textareaBg,
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: `1px solid ${colors.textareaBorder}`
            }}>
                <h1 style={{
                    textAlign: 'center',
                    marginBottom: '1rem',
                    fontSize: '2rem',
                    color: colors.text
                }}>
                    Discord <span style={{ color: colors.accentColor }}>Colored</span> Text Generator
                </h1>

                <div style={{
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    color: colors.text
                }}>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                        Create vibrant messages using ANSI color codes
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    gap: '10px'
                }}>

                    <Button
                        onClick={() => handleStyleButtonClick("0")}
                        variant="filled"
                        color="gray"
                        size="sm"
                        style={{
                            padding: '8px 16px',
                            backgroundColor: colors.buttonBg,
                            color: colors.buttonText,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        Reset All
                    </Button>
                    <Button
                        onClick={() => handleStyleButtonClick("1")}
                        variant="filled"
                        color="gray"
                        size="sm"
                        style={{
                            padding: '8px 16px',
                            backgroundColor: colors.buttonBg,
                            color: colors.buttonText,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        Bold
                    </Button>
                    <Button
                        onClick={() => handleStyleButtonClick("4")}
                        variant="filled"
                        color="gray"
                        size="sm"
                        style={{
                            padding: '8px 16px',
                            backgroundColor: colors.buttonBg,
                            color: colors.buttonText,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        Underline
                    </Button>
                </div>

                <div style={{ margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text span fw={500} mr="sm">FG</Text>
                    {[30, 31, 32, 33, 34, 35, 36, 37].map((code) => (
                        <Tooltip key={code} label={tooltipTexts[code]} position="top">
                            <Button
                                onClick={() => handleStyleButtonClick(code.toString())}
                                style={{
                                    backgroundColor: `var(--ansi-${code}-bg)`,
                                    width: '32px',
                                    height: '32px',
                                    padding: 0,
                                    margin: '0 3px'
                                }}
                            />
                        </Tooltip>
                    ))}
                </div>

                <div style={{ margin: '10px 0 30px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text span fw={500} mr="sm">BG</Text>
                    {[40, 41, 42, 43, 44, 45, 46, 47].map((code) => (
                        <Tooltip key={code} label={tooltipTexts[code]} position="top">
                            <Button
                                onClick={() => handleStyleButtonClick(code.toString())}
                                style={{
                                    backgroundColor: getBgColor(code),
                                    width: '32px',
                                    height: '32px',
                                    padding: 0,
                                    margin: '0 3px',
                                    borderRadius: '10%',
                                    border: 'none',
                                }}
                                unstyled
                            />
                        </Tooltip>
                    ))}
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                }}>
                    <div
                        ref={textareaRef}
                        contentEditable
                        style={{
                            width: '100%',
                            minHeight: '150px',
                            borderRadius: '8px',
                            resize: 'vertical',
                            overflow: 'auto',
                            textAlign: 'left',
                            fontFamily: 'monospace',
                            backgroundColor: colors.textareaBg,
                            color: colors.textareaText,
                            border: dark ? `1px solid rgb(197, 197, 197)` : `1px solid ${colors.textareaBorder}`,
                            padding: '12px',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                            outline: 'none'
                        }}
                        dangerouslySetInnerHTML={{
                            __html: 'Welcome to&nbsp;<span class="ansi-33">Rebane</span>\'s <span class="ansi-45"><span class="ansi-37">Discord</span></span>&nbsp;<span class="ansi-31">C</span><span class="ansi-32">o</span><span class="ansi-33">l</span><span class="ansi-34">o</span><span class="ansi-35">r</span><span class="ansi-36">e</span><span class="ansi-37">d</span>&nbsp;Text Generator!'
                        }}
                    />
                </div>

                <Button
                    ref={copyBtnRef}
                    onClick={handleCopy}
                    variant="outline"
                    color="blue"
                >
                    Copy text as Discord formatted
                </Button>


            </div>


            <Text size="sm" mt="xl">
                <a
                    href="https://yashmavani.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: colors.link,
                        textDecoration: 'none',
                        fontWeight: 500,
                        '&:hover': {
                            textDecoration: 'underline'
                        }
                    }}
                >
                    Yash Mavani
                </a> Production
            </Text>

            <style jsx global>{`
                .ansi-1 { font-weight:700; text-decoration:none; }
                .ansi-4 { font-weight:500; text-decoration:underline; }

                .ansi-30 { color: #4f545c; }
                .ansi-31 { color: #dc322f; }
                .ansi-32 { color: #859900; }
                .ansi-33 { color: #b58900; }
                .ansi-34 { color: #268bd2; }
                .ansi-35 { color: #d33682; }
                .ansi-36 { color: #2aa198; }
                .ansi-37 { color: #ffffff; }

                .ansi-40 { background-color: #002b36; }
                .ansi-41 { background-color: #cb4b16; }
                .ansi-42 { background-color: #586e75; }
                .ansi-43 { background-color: #657b83; }
                .ansi-44 { background-color: #839496; }
                .ansi-45 { background-color: #6c71c4; }
                .ansi-46 { background-color: #93a1a1; }
                .ansi-47 { background-color: #fdf6e3; }

                :root {
                    --ansi-30-bg: #4f545c;
                    --ansi-31-bg: #dc322f;
                    --ansi-32-bg: #859900;
                    --ansi-33-bg: #b58900;
                    --ansi-34-bg: #268bd2;
                    --ansi-35-bg: #d33682;
                    --ansi-36-bg: #2aa198;
                    --ansi-37-bg: #ffffff;
                }
            `}</style>
        </Container>
    );
};

export default DiscordColorGenerator;