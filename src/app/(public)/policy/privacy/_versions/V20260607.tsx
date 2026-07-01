import Link from "next/link";

export function PrivacyV20260607(): React.ReactElement {
  return (
    <>
      <header className="mb-12">
        <h1 className="text-heading-1 mb-4 tracking-tighter">
          청소클라쓰 개인정보처리방침
        </h1>
        <p className="text-sm leading-relaxed font-light text-slate-600">
          청소클라쓰(이하 &ldquo;회사&rdquo;)는 정보주체의 자유와 권리 보호를
          위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게
          개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 「개인정보
          보호법」 제30조에 따라 정보주체에게 개인정보의 처리와 보호에 관한 절차
          및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수
          있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </p>
      </header>

      <section
        aria-labelledby="key-info-label"
        className="mb-12 rounded-sm border border-slate-200 bg-slate-50 p-6"
      >
        <p id="key-info-label" className="text-label mb-4 text-slate-500">
          주요 개인정보 처리 표시
        </p>
        <ul className="space-y-2 text-sm font-light text-slate-700">
          <li>
            · 수집하는 개인정보:{" "}
            <strong className="font-medium text-slate-900">
              이름, 전화번호, 서비스 유형, 주소(이사 서비스의 경우
              출발지·도착지), 문의 내용, 현장 사진(선택)
            </strong>
          </li>
          <li>
            · 처리 목적:{" "}
            <strong className="font-medium text-slate-900">
              청소·이사 서비스 상담 및 견적 안내
            </strong>
          </li>
          <li>
            · 보유 기간:{" "}
            <strong className="font-medium text-slate-900">
              문의 처리 완료 후 즉시 파기 (서버 미저장)
            </strong>
          </li>
          <li>
            · 처리위탁:{" "}
            <strong className="font-medium text-slate-900">
              견적문의 이메일 송수신 (Google LLC, Gmail SMTP)
            </strong>
          </li>
          <li>
            · 고충처리 부서:{" "}
            <strong className="font-medium text-slate-900">
              대표 강승구 (010-9972-6712)
            </strong>
          </li>
        </ul>
      </section>

      <nav aria-label="개인정보처리방침 목차" className="mb-12">
        <p className="text-label mb-4 text-slate-500">목차</p>
        <ol className="space-y-1 text-sm font-light text-slate-600">
          <li>
            <a
              href="#article-1"
              className="transition-all hover:font-medium hover:text-slate-900"
            >
              1. 개인정보의 처리 목적, 수집 항목, 보유기간
            </a>
          </li>
          <li>
            <a
              href="#article-2"
              className="transition-all hover:font-medium hover:text-slate-900"
            >
              2. 개인정보의 파기 절차 및 방법
            </a>
          </li>
          <li>
            <a
              href="#article-3"
              className="transition-all hover:font-medium hover:text-slate-900"
            >
              3. 정보주체와 법정대리인의 권리·의무 및 행사방법
            </a>
          </li>
          <li>
            <a
              href="#article-4"
              className="transition-all hover:font-medium hover:text-slate-900"
            >
              4. 개인정보의 안전성 확보조치
            </a>
          </li>
          <li>
            <a
              href="#article-4-2"
              className="transition-all hover:font-medium hover:text-slate-900"
            >
              4-2. 개인정보 처리업무의 위탁 및 국외 이전
            </a>
          </li>
          <li>
            <a
              href="#article-5"
              className="transition-all hover:font-medium hover:text-slate-900"
            >
              5. 개인정보 보호책임자 및 고충사항을 처리하는 부서
            </a>
          </li>
          <li>
            <a
              href="#article-6"
              className="transition-all hover:font-medium hover:text-slate-900"
            >
              6. 개인정보 처리방침의 변경
            </a>
          </li>
        </ol>
      </nav>

      <div className="space-y-12">
        <section aria-labelledby="article-1">
          <h2 id="article-1" className="text-heading-3 mb-4">
            제1조 (개인정보의 처리 목적, 수집 항목, 보유기간)
          </h2>
          <p className="mb-6 text-sm leading-relaxed font-light text-slate-700">
            회사는 「개인정보 보호법」에 따라 서비스 제공을 위해 필요 최소한의
            범위에서 개인정보를 수집·이용합니다.
          </p>

          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-slate-800">
              1. 정보주체의 동의를 받아 처리하는 개인정보 항목
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      법적 근거
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      구분
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      처리 목적
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      처리 항목
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      처리 및 보유기간
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="align-top">
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      「개인정보 보호법」 제15조제1항 제1호 (동의)
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs font-light text-slate-700">
                      견적문의
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      청소·이사 서비스 상담 및 견적 안내
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      <strong className="font-medium text-slate-900">
                        [필수] 이름, 전화번호, 서비스 유형, 주소(이사 서비스의
                        경우 출발지·도착지), 문의 내용
                      </strong>
                      <br />
                      [선택] 현장 사진
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      <strong className="font-medium text-slate-900">
                        문의 처리 완료 후 즉시 파기
                      </strong>
                      <br />
                      (서버 미저장, 이메일 전송만)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs font-light text-slate-500">
              * 견적문의 정보는 서버에 저장되지 않으며, 이메일로 전송됩니다.
            </p>
            <p className="mt-2 text-xs leading-relaxed font-light text-slate-500">
              * 이용자가 첨부한 현장 사진에는 촬영 위치(GPS), 촬영 시각, 기기
              정보 등 메타데이터(EXIF)가 포함될 수 있으며, 회사는 이를 별도로
              추출·이용하지 않습니다.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-slate-800">
              2. 관련 법령에 따른 보유
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      내용
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      보유기간
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      소비자 불만 또는 분쟁 처리에 관한 기록
                      <br />
                      (전자상거래 등에서의 소비자보호에 관한 법률)
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs font-medium text-slate-900">
                      <strong>3년</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section aria-labelledby="article-2">
          <h2 id="article-2" className="text-heading-3 mb-4">
            제2조 (개인정보의 파기 절차 및 방법)
          </h2>
          <div className="space-y-4 text-sm leading-relaxed font-light text-slate-700">
            <p>
              ① 회사는 개인정보 보유기간의 경과, 처리 목적 달성 등 개인정보가
              불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
            </p>
            <p>② 개인정보 파기의 절차 및 방법은 다음과 같습니다.</p>
            <div className="ml-4 space-y-3">
              <div>
                <p className="font-medium text-slate-800">1. 파기 절차</p>
                <p className="mt-1 ml-4">
                  회사는 파기 사유가 발생한 개인정보를 선정하고, 개인정보
                  보호책임자의 승인을 받아 개인정보를 파기합니다.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-800">2. 파기 방법</p>
                <ul className="mt-1 ml-4 space-y-1">
                  <li>- 전자적 파일: 기록을 재생할 수 없도록 안전하게 삭제</li>
                  <li>
                    - 견적문의 정보: 서버에 저장되지 않고 이메일로 전송되므로,
                    수신된 이메일의 삭제로 파기합니다.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="article-3">
          <h2 id="article-3" className="text-heading-3 mb-4">
            제3조 (정보주체와 법정대리인의 권리·의무 및 행사방법)
          </h2>
          <div className="space-y-4 text-sm leading-relaxed font-light text-slate-700">
            <p>
              ① 정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지
              및 동의 철회 요구 등의 권리를 행사할 수 있으며, 「개인정보
              보호법」 제38조제1항에 따라 대리인을 통하여 권리를 행사할 수도
              있습니다.
            </p>
            <p>
              ② 권리 행사는 「개인정보 보호법 시행령」 제41조제1항에 따라 서면,
              전화, 전자우편을 통하여 하실 수 있습니다.
            </p>
            <p>
              ③ 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을
              통하여 하실 수도 있습니다. 이 경우 「개인정보 처리방법에 관한
              고시」 [별지 11] 서식에 따른 위임장을 제출하셔야 합니다. 회사는
              권리 행사를 한 자가 본인이거나 정당한 대리인인지를 확인합니다.
            </p>
            <p>
              ④ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한
              경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를
              이용하거나 제공하지 않습니다.
            </p>
            <p>
              ⑤ 회사는 정보주체로부터 권리 행사를 청구받은 날로부터{" "}
              <strong className="font-medium text-slate-900">10일 이내</strong>
              에 회신하겠습니다.
            </p>
          </div>
        </section>

        <section aria-labelledby="article-4">
          <h2 id="article-4" className="text-heading-3 mb-4">
            제4조 (개인정보의 안전성 확보조치)
          </h2>
          <p className="mb-4 text-sm leading-relaxed font-light text-slate-700">
            회사는 「개인정보 보호법」 제29조에 따라 다음과 같이 안전성 확보에
            필요한 조치를 하고 있습니다.
          </p>
          <div className="ml-4 space-y-3 text-sm leading-relaxed font-light text-slate-700">
            <div>
              <p className="font-medium text-slate-800">1. 관리적 조치</p>
              <p className="mt-1 ml-4">
                개인정보 보호책임자 지정, 개인정보 취급자 최소화
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-800">2. 기술적 조치</p>
              <p className="mt-1 ml-4">
                개인정보 전송 시{" "}
                <strong className="font-medium text-slate-900">
                  SSL/TLS(HTTPS) 암호화
                </strong>{" "}
                적용, 개인정보 처리 시스템에 대한 접근 권한 관리 및 접근 통제
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-800">3. 물리적 조치</p>
              <p className="mt-1 ml-4">
                견적문의 정보는 서버에 저장하지 않으며, 관리자 인증 정보는
                암호화된 외부 인증 시스템을 통해 관리
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="article-4-2">
          <h2 id="article-4-2" className="text-heading-3 mb-4">
            제4조의2 (개인정보 처리업무의 위탁 및 국외 이전)
          </h2>
          <div className="space-y-4 text-sm leading-relaxed font-light text-slate-700">
            <p>
              ① 회사는 견적문의 이메일의 안정적인 송수신을 위하여 다음과 같이
              개인정보 처리업무를 위탁하고 있으며, 위탁받은 자(이하
              &ldquo;수탁사&rdquo;)는 위탁받은 업무 이외의 목적으로 이용할 수
              없도록 관계 법령에 따라 관리·감독하고 있습니다.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      수탁사
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      위탁 업무
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      이전 정보
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="align-top">
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      <strong className="font-medium text-slate-900">
                        Google LLC
                      </strong>
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      견적문의 이메일 송수신 (Gmail SMTP)
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      이용자가 견적문의 양식에 입력한 개인정보 (이메일 본문 및
                      첨부 사진)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              ② 위탁사에 의한 처리는 정보주체와의 계약 이행(견적문의 처리)을
              위하여 필요한 범위에서만 이루어지며, 위탁 업무의 내용이나 수탁사가
              변경될 경우 지체 없이 본 개인정보 처리방침을 통해 공개합니다.
            </p>

            <p>
              ③{" "}
              <strong className="font-medium text-slate-900">
                개인정보 국외 이전 안내
              </strong>
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      이전 받는 자
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      이전 국가
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      이전 시점·방법
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      이전 항목
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      보유·이용 기간
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="align-top">
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      Google LLC
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      미국 및 Google 글로벌 인프라
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      견적문의 이메일 발송 시점, 네트워크(TLS 암호화)를 통한
                      전송
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      이용자가 견적문의 양식에 입력한 개인정보(이메일 본문 및
                      첨부 사진)
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs leading-relaxed font-light text-slate-700">
                      Google 의 이메일 보존 정책에 따름 (회사 메일함 삭제 시
                      회사 보존 종료)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              ④ 이전 근거: 「개인정보 보호법」 제28조의8 제1항 제2호
              (정보주체와의 계약의 체결 및 이행을 위하여 개인정보의 처리위탁이
              필요한 경우).
            </p>
            <p>
              ⑤ 정보주체는 국외 이전을 거부할 수 있으며, 거부 시 견적문의 서비스
              이용이 제한될 수 있습니다. 거부를 원하시는 경우 전화 또는 개인정보
              보호책임자 이메일을 통해 직접 연락주시기 바랍니다.
            </p>
          </div>
        </section>

        <section aria-labelledby="article-5">
          <h2 id="article-5" className="text-heading-3 mb-4">
            제5조 (개인정보 보호책임자 및 고충사항을 처리하는 부서)
          </h2>
          <div className="space-y-4 text-sm leading-relaxed font-light text-slate-700">
            <p>
              ① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
              처리와 관련한 정보주체의 불만 처리 및 피해 구제 등을 위하여 아래와
              같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      직위
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      성명
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      연락처
                    </th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-xs font-bold text-slate-700">
                      이메일
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-4 py-3 text-xs font-light text-slate-700">
                      대표
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs font-medium text-slate-900">
                      <strong>강승구</strong>
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs font-medium text-slate-900">
                      <strong>
                        <a
                          href="tel:010-9972-6712"
                          className="transition-colors hover:text-slate-600"
                        >
                          010-9972-6712
                        </a>
                      </strong>
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-xs font-medium text-slate-900">
                      <strong>tmdrn0110@naver.com</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              ② 정보주체는 회사의 서비스를 이용하시면서 발생한 모든 개인정보보호
              관련 문의, 불만 처리, 피해 구제 등에 관한 사항을 개인정보
              보호책임자에게 문의할 수 있습니다. 회사는 정보주체의 문의에 대해
              지체 없이 답변 및 처리해 드리겠습니다.
            </p>
            <p>
              ③ 정보주체는 개인정보침해로 인한 구제를 받기 위하여
              개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에
              분쟁해결이나 상담 등을 신청할 수 있습니다. 이 밖에 기타
              개인정보침해의 신고, 상담에 대하여는 아래의 기관에 문의하시기
              바랍니다.
            </p>
            <ol className="ml-4 space-y-1 text-sm font-light text-slate-700">
              <li>
                1. 개인정보분쟁조정위원회: (국번없이){" "}
                <strong className="font-medium text-slate-900">
                  1833-6972
                </strong>{" "}
                (
                <a
                  href="https://www.kopico.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 underline decoration-slate-400 underline-offset-2 transition-colors hover:text-slate-900 hover:decoration-slate-700"
                >
                  www.kopico.go.kr
                </a>
                )
              </li>
              <li>
                2. 개인정보침해신고센터: (국번없이){" "}
                <strong className="font-medium text-slate-900">118</strong> (
                <a
                  href="https://privacy.kisa.or.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 underline decoration-slate-400 underline-offset-2 transition-colors hover:text-slate-900 hover:decoration-slate-700"
                >
                  privacy.kisa.or.kr
                </a>
                )
              </li>
              <li>
                3. 대검찰청: (국번없이){" "}
                <strong className="font-medium text-slate-900">1301</strong> (
                <a
                  href="https://www.spo.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 underline decoration-slate-400 underline-offset-2 transition-colors hover:text-slate-900 hover:decoration-slate-700"
                >
                  www.spo.go.kr
                </a>
                )
              </li>
              <li>
                4. 경찰청: (국번없이){" "}
                <strong className="font-medium text-slate-900">182</strong> (
                <a
                  href="https://ecrm.police.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 underline decoration-slate-400 underline-offset-2 transition-colors hover:text-slate-900 hover:decoration-slate-700"
                >
                  ecrm.police.go.kr
                </a>
                )
              </li>
            </ol>
          </div>
        </section>

        <section aria-labelledby="article-6">
          <h2 id="article-6" className="text-heading-3 mb-4">
            제6조 (개인정보 처리방침의 변경)
          </h2>
          <div className="space-y-4 text-sm leading-relaxed font-light text-slate-700">
            <p>
              ① 이 개인정보 처리방침은{" "}
              <strong className="font-medium text-slate-900">
                2026년 6월 7일
              </strong>
              부터 적용됩니다.
            </p>
            <p>
              ② 이전의 개인정보 처리방침은 페이지 상단의 시행 버전 선택을 통해
              확인하실 수 있습니다.{" "}
              <Link
                href="/policy/privacy/2026-03-23"
                className="font-medium text-slate-900 underline decoration-slate-400 underline-offset-4 transition-colors hover:decoration-slate-900"
              >
                2026.03.23 ~ 2026.06.06 적용 버전 보기
              </Link>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
