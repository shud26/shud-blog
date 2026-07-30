#!/bin/sh
# 프로덕션 배포 + 미커밋 경고.
#
# 왜 있나: `vercel --prod`는 git이 아니라 **워킹 디렉터리를 그대로** 배포한다.
# 그래서 커밋 안 한 파일도 사이트에는 올라가고 레포에는 안 남는다.
# 2026-07-28에 온체인 5편 글과 7/24·7/28 일지가 사흘 동안 사이트에만 존재하는 걸 발견했다.
# 자동배포(git 연동)가 살아있을 땐 git이 곧 사이트였는데, 수동 체제로 바뀌면서 둘이 갈라졌다.
#
# 사용: ./deploy.sh        미커밋이 있으면 물어보고 진행
#       ./deploy.sh -y     묻지 않고 진행 (자동화용)
set -e

cd "$(dirname "$0")"

ASSUME_YES=0
[ "${1:-}" = "-y" ] && ASSUME_YES=1

# 확인 실패를 "깨끗함"으로 처리하지 않는다. 모르는 것과 괜찮은 것은 다르다.
if ! DIRTY=$(git status --porcelain 2>/dev/null); then
    echo "⚠️  git 상태를 확인할 수 없습니다. 커밋 여부를 모른 채 배포합니다." >&2
    DIRTY=""
    UNKNOWN=1
else
    UNKNOWN=0
fi

if [ -n "$DIRTY" ]; then
    COUNT=$(printf '%s\n' "$DIRTY" | wc -l | tr -d ' ')
    # ${} 필수: 변수 바로 뒤에 한글이 오면 셸이 첫 바이트를 변수명으로 먹는다
    echo "⚠️  커밋되지 않은 변경 ${COUNT}개가 이번 배포에 포함됩니다:"
    printf '%s\n' "$DIRTY" | sed 's/^/    /'
    echo
    echo "    vercel은 워킹 디렉터리를 배포하므로, 커밋하지 않으면"
    echo "    이 내용은 사이트에만 존재하고 레포에는 안 남습니다."
    echo
    if [ "$ASSUME_YES" -eq 0 ] && [ -t 0 ]; then
        printf "    그래도 배포할까요? [y/N] "
        read -r ans
        case "$ans" in
            y|Y) ;;
            *) echo "취소했습니다. 먼저 커밋하세요:"; \
               echo "  git add -A && git commit -m \"...\" && git push"; exit 1 ;;
        esac
    fi
fi

npx vercel --prod --yes

# 배포 후에도 남아 있으면 다시 알린다. 괴리는 올라간 다음에야 성립한다.
if [ -n "$DIRTY" ]; then
    echo
    echo "⚠️  배포 완료. 위 파일들은 아직 git에 없습니다. 지금 커밋하세요:"
    echo "  git add -A && git commit -m \"...\" && git push"
elif [ "$UNKNOWN" -eq 1 ]; then
    echo
    echo "⚠️  배포 완료. git 상태는 확인하지 못했습니다."
fi
