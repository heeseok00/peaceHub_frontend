'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { createRoom, joinRoom } from '@/lib/api/endpoints';

/**
 * 방 참여/생성 페이지
 *
 * 탭 형태로 "방 만들기"와 "방 참여" 제공
 * - 방 만들기: 방 이름 입력 후 생성, 생성된 코드 표시
 * - 방 참여: 방 코드 입력 후 참여
 *
 * 완료 후 /schedule로 이동
 */

type Tab = 'create' | 'join';

export default function JoinRoomPage() {
  const router = useRouter();

  // 탭 상태 (기본: 방 만들기)
  const [activeTab, setActiveTab] = useState<Tab>('create');

  // 방 만들기 폼 상태
  const [roomName, setRoomName] = useState('');
  const [roomNameError, setRoomNameError] = useState('');

  // 방 참여 폼 상태
  const [roomCode, setRoomCode] = useState('');
  const [roomCodeError, setRoomCodeError] = useState('');

  // 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 방 생성 성공 모달
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  /**
   * 방 만들기 핸들러
   */
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!roomName.trim()) {
      setRoomNameError('방 이름을 입력해주세요');
      return;
    }
    if (roomName.trim().length < 2) {
      setRoomNameError('방 이름은 2자 이상 입력해주세요');
      return;
    }
    setRoomNameError('');

    setIsSubmitting(true);

    try {
      // API 호출
      const room = await createRoom(roomName.trim());

      // 성공 모달 표시
      setCreatedRoomCode(room.code);
      setShowSuccessModal(true);
    } catch (error) {
      alert('방 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 방 참여 핸들러
   */
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!roomCode.trim()) {
      setRoomCodeError('방 코드를 입력해주세요');
      return;
    }
    if (roomCode.trim().length !== 6) {
      setRoomCodeError('방 코드는 6자리입니다');
      return;
    }
    setRoomCodeError('');

    setIsSubmitting(true);

    try {
      // API 호출
      await joinRoom(roomCode.trim().toUpperCase());

      // 성공 시 다음 페이지로 이동
      router.push('/onboarding/schedule');
    } catch (error) {
      setRoomCodeError('유효하지 않은 방 코드입니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 방 코드 복사 핸들러
   */
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(createdRoomCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      alert('복사에 실패했습니다');
    }
  };

  /**
   * 모달 닫기 및 다음 페이지로 이동
   */
  const handleModalClose = () => {
    setShowSuccessModal(false);
    setIsCopied(false);
    router.push('/onboarding/schedule');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            방 만들기 & 참여
          </h1>
          <p className="text-gray-600">
            새로운 방을 만들거나 기존 방에 참여하세요
          </p>
        </div>

        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            방 만들기
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'join'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            방 참여
          </button>
        </div>

        {/* 폼 카드 */}
        <Card padding="lg" shadow>
          {/* 방 만들기 탭 */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  룸메이트들과 함께 사용할 방을 만드세요
                </p>
              </div>

              <Input
                label="방 이름"
                type="text"
                placeholder="예: 301호"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                error={roomNameError}
                fullWidth
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? '생성 중...' : '방 만들기'}
              </Button>
            </form>
          )}

          {/* 방 참여 탭 */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinRoom} className="space-y-5">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  룸메이트에게 받은 6자리 방 코드를 입력하세요
                </p>
              </div>

              <Input
                label="방 코드"
                type="text"
                placeholder="ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                error={roomCodeError}
                fullWidth
                required
                maxLength={6}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? '참여 중...' : '방 참여하기'}
              </Button>
            </form>
          )}
        </Card>

        {/* 프로그레스 표시 */}
        <div className="mt-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-600"></div>
            <div className="w-3 h-3 rounded-full bg-primary-600"></div>
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            2 / 3 단계: 방 참여
          </p>
        </div>
      </div>

      {/* 방 생성 성공 모달 */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        title="방이 생성되었습니다!"
        showCloseButton={true}
      >
        <div className="text-center space-y-4">
          <p className="text-gray-700">
            룸메이트들에게 아래 코드를 공유해주세요
          </p>
          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">방 코드</p>
            <p className="text-4xl font-bold text-primary-700 tracking-wider mb-4">
              {createdRoomCode}
            </p>
            <Button
              onClick={handleCopyCode}
              variant={isCopied ? 'outline' : 'primary'}
              size="md"
            >
              {isCopied ? '✓ 복사됨' : '복사하기'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
