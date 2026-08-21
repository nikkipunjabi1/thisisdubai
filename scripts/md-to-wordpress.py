import io,re,html,sys

GOLD='#eeae56'; NAVY='#2b4b72'
# Hex, not rgba: WordPress's wp_kses inline-CSS filter is unreliable with rgba() for
# users without unfiltered_html, and it only bites on save, so the editor looks fine.
HEADBG='#eaeef3'; RULE='#dfe4ea'

def inline(t):
    t=html.escape(t, quote=False)
    t=re.sub(r'`([^`]+)`', r'<code style="background:rgba(43,75,114,0.07);padding:2px 5px;border-radius:3px;font-size:0.92em;">\1</code>', t)
    t=re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    t=re.sub(r'(?<![\w*])\*([^*\n]+)\*(?![\w*])', r'<em>\1</em>', t)
    t=re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    return t

def convert(md):
    # strip frontmatter
    if md.startswith('---'):
        md = md.split('---',2)[2]
    lines = md.split('\n')
    out=[]; i=0
    while i < len(lines):
        ln = lines[i]

        # internal build note -> drop
        if ln.startswith('> **Copy final'):
            while i < len(lines) and lines[i].startswith('>'): i+=1
            continue

        # screenshot placeholders -> drop (replaced by real images at publish time)
        if ln.startswith('📷'):
            while i < len(lines) and lines[i].strip() and not lines[i].startswith('#'): i+=1
            continue

        if not ln.strip():
            i+=1; continue

        # image
        m = re.match(r'!\[(.*?)\]\((.*?)\)', ln)
        if m:
            out.append(f'<figure style="margin:32px 0;"><img src="{m.group(2)}" alt="{html.escape(m.group(1))}" style="width:100%;height:auto;border:1px solid rgba(43,75,114,0.18);border-radius:8px;" /></figure>')
            i+=1; continue

        # headings
        if ln.startswith('### '):
            out.append(f'<h3 style="margin-top:34px;">{inline(ln[4:])}</h3>'); i+=1; continue
        if ln.startswith('## '):
            out.append(f'<hr>\n<h2 style="margin-top:38px;">{inline(ln[3:])}</h2>'); i+=1; continue
        if ln.startswith('# '):
            i+=1; continue

        # code fence
        if ln.startswith('```'):
            i+=1; buf=[]
            while i < len(lines) and not lines[i].startswith('```'):
                buf.append(lines[i]); i+=1
            i+=1
            code=html.escape('\n'.join(buf))
            out.append(f'<pre style="background:#f6f7f9;border:1px solid rgba(43,75,114,0.15);border-left:4px solid {GOLD};border-radius:6px;padding:16px 18px;overflow-x:auto;font-size:0.9em;line-height:1.55;"><code>{code}</code></pre>')
            continue

        # blockquote
        if ln.startswith('> '):
            buf=[]
            while i < len(lines) and lines[i].startswith('>'):
                buf.append(lines[i].lstrip('>').strip()); i+=1
            body=inline(' '.join(x for x in buf if x))
            out.append(f'<blockquote style="border-left:4px solid {GOLD};background:rgba(238,174,86,0.07);padding:14px 20px;margin:26px 0;border-radius:0 6px 6px 0;"><p style="margin:0;">{body}</p></blockquote>')
            continue

        # table
        if ln.startswith('|'):
            rows=[]
            while i < len(lines) and lines[i].startswith('|'):
                rows.append(lines[i]); i+=1
            cells=[[c.strip() for c in r.strip().strip('|').split('|')] for r in rows]
            cells=[c for c in cells if not all(re.fullmatch(r':?-{2,}:?', x or '-') for x in c)]
            head=cells[0]; body=cells[1:]
            t=[f'<table style="width:100% !important;border-collapse:collapse !important;margin:26px 0;font-size:0.95em;">']
            t.append('<thead><tr>'+''.join(
                f'<th style="text-align:left !important;padding:10px 12px !important;background-color:{HEADBG} !important;border-bottom:2px solid {NAVY} !important;">{inline(h)}</th>' for h in head)+'</tr></thead><tbody>')
            for r in body:
                r = r + ['']*(len(head)-len(r))
                t.append('<tr>'+''.join(
                    f'<td style="padding:10px 12px !important;border-bottom:1px solid {RULE} !important;vertical-align:top;">{inline(c)}</td>' for c in r)+'</tr>')
            t.append('</tbody></table>')
            out.append('\n'.join(t)); continue

        # lists
        if re.match(r'^\s*[-*] ', ln) or re.match(r'^\s*\d+\. ', ln):
            ordered = bool(re.match(r'^\s*\d+\. ', ln))
            items=[]
            while i < len(lines) and (re.match(r'^\s*[-*] ', lines[i]) or re.match(r'^\s*\d+\. ', lines[i]) or (lines[i].startswith('  ') and lines[i].strip() and items)):
                l=lines[i]
                m2=re.match(r'^\s*(?:[-*]|\d+\.) (.*)$', l)
                if m2: items.append(m2.group(1))
                elif items: items[-1]+=' '+l.strip()
                i+=1
            tag='ol' if ordered else 'ul'
            out.append(f'<{tag} style="padding-left:22px;line-height:1.7;">'+''.join(f'<li style="margin-bottom:9px;">{inline(x)}</li>' for x in items)+f'</{tag}>')
            continue

        # paragraph
        buf=[ln]; i+=1
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#|\||>|```|!\[|\s*[-*] |\s*\d+\. |📷)', lines[i]):
            buf.append(lines[i]); i+=1
        out.append(f'<p>{inline(" ".join(x.strip() for x in buf))}</p>')
    return '\n\n'.join(out)

src, dst = sys.argv[1], sys.argv[2]
body = convert(io.open(src,encoding='utf-8').read())
io.open(dst,'w',encoding='utf-8').write(body+'\n')
print('wrote', dst)
